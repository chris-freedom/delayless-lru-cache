import { LruList } from './lru-list.js'

export class DelaylessLruCache {
  constructor({ duration, maxEntriesAmount }) {
    this.cache = new Map()
    this.tasks = new Map()
    this.runningTasks = new Map()
    this.lruList = new LruList({ duration, maxEntriesAmount })
  }

  setTask(key, task, errorHandler) {
    if (typeof task !== 'function') throw new Error('Task must be a function')
    this.tasks.set(key, { task, errorHandler })
  }

  setTaskOnce(key, task) {
    if (this.tasks.has(key)) return
    this.setTask(key, task)
  }

  async get(key) {
    if (!this.tasks.has(key)) {
      throw new Error(`Task must be defined for the "${key}" key`)
    }

    const storedNode = this.cache.get(key)

    if (!storedNode) {
      return this.#initialRetrieving(key)
    }

    return this.#getStaleWhileRevalidate(key, storedNode)
  }

  async #initialRetrieving(key) {
    if (this.#isTaskRunning(key)) return this.runningTasks.get(key)

    const { task } = this.tasks.get(key)

    try {
      const runningTask = task()
      this.runningTasks.set(key, runningTask)
      const node = this.lruList.createNode(key, (k) => this.cache.delete(k))
      const payload = await runningTask

      if (this.lruList.isNodeExists(node)) {
        this.lruList.updatePayload(node, payload)
        this.cache.set(key, node)
      }

      this.runningTasks.delete(key)

      return payload
    } catch (err) {
      this.runningTasks.delete(key)
      throw err
    }
  }

  #getStaleWhileRevalidate(key, storedNode) {
    const node = this.lruList.moveNodeToHead(storedNode)

    if (this.lruList.isObsoleteNode(node) && !this.#isTaskRunning(key)) {
      this.#revalidate(key)
    }

    return node.value.payload
  }

  #isTaskRunning(key) {
    return this.runningTasks.has(key)
  }

  #revalidate(key) {
    const { task } = this.tasks.get(key)
    const runningTask = task()
    this.runningTasks.set(key, runningTask)
    runningTask
      .then((payload) => {
        if (this.cache.has(key)) {
          const storedNode = this.cache.get(key)
          this.lruList.updateNode(storedNode, payload)
        }
      })
      .catch((err) => {
        const { errorHandler } = this.tasks.get(key)
        if (typeof errorHandler === 'function') errorHandler(err, key)
      })
      .finally(() => {
        this.runningTasks.delete(key)
      })
  }
}
