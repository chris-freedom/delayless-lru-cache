import { LruList } from './lru-list.js'

export class LruCache {
  constructor(duration, maxEntriesAmount) {
    this.cache = new Map()
    this.tasks = new Map()
    this.pendingTasks = new Set()
    this.lruList = new LruList(duration, maxEntriesAmount)
  }

  setTask(key, task) {
    if (typeof task !== 'function') throw new Error('Task must be a function')
    this.tasks.set(key, task)
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
    const { value } = storedNode

    if (this.lruList.isObsoleteNode(storedNode)) {
      if (!this.#isRevalidationPending(key)) this.#revalidate(key)

      return value.payload
    }

    return value.payload
  }

  async #initialRetrieving(key) {
    const task = this.tasks.get(key)
    const payload = await task()
    this.tasks.set(key, task)
    const node = this.lruList.createNode(key, payload)
    this.cache.set(key, node)

    return payload
  }

  #isRevalidationPending(key) {
    return this.pendingTasks.has(key)
  }

  #revalidate(key) {
    this.pendingTasks.add(key)
    const task = this.tasks.get(key)
    task().then((payload) => {
      const storedNode = this.cache.get(key)
      const node = this.lruList.updateNode(storedNode, payload)
      this.cache.set(key, node)
      this.pendingTasks.delete(key)
    })
  }
}
