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
    this.list = new Yallist()
  }

  createNode(key, payload) {
    if (!this.isEnoughSpace) this.list.removeNode(this.list.tail)

    this.list.unshift({
      key,
      payload,
      updatedAt: Date.now(),
    })

    return this.list.head
  }

  updateNode(node, payload) {
    const { value } = node
    value.payload = payload
    value.updatedAt = Date.now()
    this.list.unshiftNode(node)

    return node
  }

  moveNodeToHead(node) {
    this.list.unshiftNode(node)

    return this.list.head
  }

  isObsoleteNode(node) {
    const { value } = node
    const secondsPassed = Math.round((Date.now() - value.updatedAt) / 1000)
    return this.duration <= secondsPassed
  }

  get isEnoughSpace() {
    return this.maxEntriesAmount > this.list.length
  }
}
