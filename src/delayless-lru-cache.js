import { LruList } from './lru-list.js'

export class DelaylessLruCache {
  constructor({ duration, maxEntriesAmount }) {
    this.cache = new Map()
    this.tasks = new Map()
    this.pendingTasks = new Set()
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

  #getStaleWhileRevalidate(key, storedNode) {
    const node = this.lruList.moveNodeToHead(storedNode)
    const { value } = node
    this.cache.set(key, node)

    if (this.lruList.isObsoleteNode(node) && !this.#isRevalidationPending(key)) {
      this.#revalidate(key)
    }

    return value.payload
  }

  async #initialRetrieving(key) {
    const { task } = this.tasks.get(key)
    const payload = await task()
    const node = this.lruList.createNode(key, payload)
    this.cache.set(key, node)

    return payload
  }

  #isRevalidationPending(key) {
    return this.pendingTasks.has(key)
  }

  #revalidate(key) {
    this.pendingTasks.add(key)
    const { task, errorHandler } = this.tasks.get(key)
    task().then((payload) => {
      const storedNode = this.cache.get(key)
      const node = this.lruList.updateNode(storedNode, payload)
      this.cache.set(key, node)
    }).catch((err) => {
      if (typeof errorHandler === 'function') errorHandler(err, key)
    }).finally(() => {
      this.pendingTasks.delete(key)
    })
  }
}
