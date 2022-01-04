import Yallist from 'yallist'

export class LruList {
  #duration = Infinity
  #maxEntriesAmount = Infinity
  #nodesMapper = new Map()
  #list = new Yallist()

  constructor({ duration, maxEntriesAmount }) {
    this.#duration = duration ?? this.#duration
    this.#maxEntriesAmount = maxEntriesAmount ?? this.#maxEntriesAmount

    if (typeof this.#duration !== 'number' || this.#duration < 0) {
      throw new TypeError('duration must be a non-negative number')
    }

    if (
      typeof this.#maxEntriesAmount !== 'number' ||
      this.#maxEntriesAmount < 1
    ) {
      throw new TypeError('maxEntriesAmount must be bigger than 1')
    }
  }

  createNode(key, onDeleteCallback) {
    if (!this.isEnoughSpace) {
      const nodeKeyToDelete = this.#list.tail.value.key

      if (typeof onDeleteCallback === 'function') {
        onDeleteCallback(nodeKeyToDelete)
      }

      this.#nodesMapper.delete(nodeKeyToDelete)
      this.#list.removeNode(this.#list.tail)
    }

    this.#list.unshift({
      key,
      payload: null,
      updatedAt: Date.now(),
    })
    const node = this.#list.head
    this.#nodesMapper.set(key, node)

    return node
  }

  updatePayload(node, payload) {
    node.value.payload = payload
  }

  updateNode(node, payload) {
    const { value } = node
    value.payload = payload
    value.updatedAt = Date.now()
    this.#list.unshiftNode(node)

    return node
  }

  moveNodeToHead(keyOrNode) {
    let node = keyOrNode

    if (typeof keyOrNode === 'string' || typeof keyOrNode === 'number') {
      node = this.#nodesMapper.get(keyOrNode)
    }

    this.#list.unshiftNode(node)

    return this.#list.head
  }

  isObsoleteNode(node) {
    const { value } = node
    const secondsPassed = Math.round((Date.now() - value.updatedAt) / 1000)
    return this.#duration <= secondsPassed
  }

  isNodeExists(node) {
    return this.#nodesMapper.has(node.value.key)
  }

  get isEnoughSpace() {
    return this.#maxEntriesAmount > this.#list.length
  }

  get list() {
    return this.#list
  }
}
