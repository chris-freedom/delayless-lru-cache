import Yallist from 'yallist'

export class LruList {
  constructor({ duration = Infinity, maxEntriesAmount = Infinity }) {
    if (typeof duration !== 'number' || duration < 0) {
      throw new TypeError('duration must be a non-negative number')
    }

    if (typeof maxEntriesAmount !== 'number' || maxEntriesAmount < 1) {
      throw new TypeError('maxEntriesAmount must be bigger than 1')
    }

    this.duration = duration
    this.maxEntriesAmount = maxEntriesAmount
    this.nodesMapper = new Map()
    this.list = new Yallist()
  }

  createNode(key, onDeleteCallback) {
    if (!this.isEnoughSpace) {
      const nodeKeyToDelete = this.list.tail.value.key

      if (typeof onDeleteCallback === 'function') {
        onDeleteCallback(nodeKeyToDelete)
      }

      this.nodesMapper.delete(nodeKeyToDelete)
      this.list.removeNode(this.list.tail)
    }

    this.list.unshift({
      key,
      payload: null,
      updatedAt: Date.now(),
    })
    const node = this.list.head
    this.nodesMapper.set(key, node)

    return node
  }

  updatePayload(node, payload) {
    node.value.payload = payload
  }

  updateNode(node, payload) {
    const { value } = node
    value.payload = payload
    value.updatedAt = Date.now()
    this.list.unshiftNode(node)

    return node
  }

  moveNodeToHead(keyOrNode) {
    let node = keyOrNode

    if (typeof keyOrNode === 'string' || typeof keyOrNode === 'number') {
      node = this.nodesMapper.get(keyOrNode)
    }

    this.list.unshiftNode(node)

    return this.list.head
  }

  isObsoleteNode(node) {
    const { value } = node
    const secondsPassed = Math.round((Date.now() - value.updatedAt) / 1000)
    return this.duration <= secondsPassed
  }

  isNodeExists(node) {
    return this.nodesMapper.has(node.value.key)
  }

  get isEnoughSpace() {
    return this.maxEntriesAmount > this.list.length
  }
}
