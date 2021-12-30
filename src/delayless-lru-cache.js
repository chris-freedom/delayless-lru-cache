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
    const storedNode = this.cache.get(key)

    if (!storedNode) {
      return this.#initialRetrieving(key)
    }

    return this.#getStaleWhileRevalidate(key, storedNode)
  }

  async #initialRetrieving(key) {
    if (this.runningTasks.has(key)) return this.runningTasks.get(key)

    const { task } = this.tasks.get(key)
    const runningTask = task()
    this.runningTasks.set(key, runningTask)
    const payload = await runningTask
    const node = this.lruList.createNode(key, payload)
    this.cache.set(key, node)
    this.runningTasks.delete(key)

    return payload
  }

  #getStaleWhileRevalidate(key, storedNode) {
    const node = this.lruList.moveNodeToHead(storedNode)
    const { value } = node
    this.cache.set(key, node)

    if (
      this.lruList.isObsoleteNode(node) &&
      !this.#isRevalidationRunning(key)
    ) {
      this.#revalidate(key)
    }

    return value.payload
  }

  #isRevalidationRunning(key) {
    return this.runningTasks.has(key)
  }

  #revalidate(key) {
    const { task, errorHandler } = this.tasks.get(key)
    const runningTask = task()
    this.runningTasks.set(key, runningTask)
    runningTask
      .then((payload) => {
        const storedNode = this.cache.get(key)
        const node = this.lruList.updateNode(storedNode, payload)
        this.cache.set(key, node)
      })
      .catch((err) => {
        if (typeof errorHandler === 'function') errorHandler(err, key)
      })
      .finally(() => {
        this.runningTasks.delete(key)
      })
  }
}
