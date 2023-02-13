import { LruList } from './lru-list.js'

export class DelaylessLruCache {
  #lruList
  #cache = new Map()
  #tasks = new Map()
  #runningTasks = new Map()

  constructor({ duration, maxEntriesAmount }) {
    this.#lruList = new LruList({ duration, maxEntriesAmount })
  }

  get tasks() {
    return this.#tasks
  }

  get list() {
    return this.#lruList.list
  }

  get runningTasks() {
    return this.#runningTasks
  }

  setTask(key, task, errorHandler) {
    if (!DelaylessLruCache.#isValidKey(key)) {
      throw new Error(
        `Key must be a string or a number. ${typeof key} was given`
      )
    }

    if (typeof task !== 'function') {
      throw new Error('Task must be a function')
    }

    this.#tasks.set(key, { task, errorHandler })
  }

  setTaskOnce(key, task, errorHandler) {
    if (!DelaylessLruCache.#isValidKey(key)) {
      throw new Error(
        `Key must be a string or a number. ${typeof key} was given`
      )
    }

    if (this.#tasks.has(key)) return
    this.setTask(key, task, errorHandler)
  }

  async get(key) {
    if (!DelaylessLruCache.#isValidKey(key)) {
      throw new Error(
        `Key must be a string or a number. ${typeof key} was given`
      )
    }

    if (!this.#tasks.has(key)) {
      throw new Error(`Task must be defined for the "${key}" key`)
    }

    const storedNode = this.#cache.get(key)

    if (!storedNode) {
      return this.#initialRetrieving(key)
    }

    return this.#getStaleWhileRevalidate(key, storedNode)
  }

  isTaskRunning(key) {
    return this.#runningTasks.has(key)
  }

  async #initialRetrieving(key) {
    if (this.isTaskRunning(key)) {
      this.#lruList.moveNodeToHead(key)
      return this.#runningTasks.get(key)
    }

    const { task } = this.#tasks.get(key)

    try {
      const runningTask = task()

      if (!(runningTask instanceof Promise)) {
        throw new Error(`Task of the "${key}" key must return a promise`)
      }

      this.#runningTasks.set(key, runningTask)
      const node = this.#lruList.createNode(key, (k) => {
        this.#tasks.delete(k)
        this.#cache.delete(k)
      })
      const payload = await runningTask

      if (this.#lruList.isNodeExists(node)) {
        this.#lruList.updatePayload(node, payload)
        this.#cache.set(key, node)
      }

      return payload
    } finally {
      this.#runningTasks.delete(key)
    }
  }

  #getStaleWhileRevalidate(key, storedNode) {
    const node = this.#lruList.moveNodeToHead(storedNode)

    if (this.#lruList.isObsoleteNode(node) && !this.isTaskRunning(key)) {
      this.#revalidate(key)
    }

    return node.value.payload
  }

  static #isValidKey(key) {
    return typeof key === 'string' || typeof key === 'number'
  }

  #revalidate(key) {
    const { task } = this.#tasks.get(key)
    const runningTask = task()

    if (!(runningTask instanceof Promise)) {
      throw new Error(`Task of the "${key}" key must return a promise`)
    }

    this.#runningTasks.set(key, runningTask)
    runningTask
      .then((payload) => {
        if (this.#cache.has(key)) {
          const storedNode = this.#cache.get(key)
          this.#lruList.updateNode(storedNode, payload)
        }
      })
      .catch((err) => {
        const { errorHandler } = this.#tasks.get(key)
        if (typeof errorHandler === 'function') errorHandler(err, key)
      })
      .finally(() => {
        this.#runningTasks.delete(key)
      })
  }
}
