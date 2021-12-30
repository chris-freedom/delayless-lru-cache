import { LruList } from '../lru-list.js'
import { beforeEach, expect, jest } from '@jest/globals'
import { setTimeout } from 'timers/promises'

describe('LRU list tests', () => {
  let lruList

  beforeEach(() => {
    lruList = new LruList({ duration: 2, maxEntriesAmount: 3 })
  })

  test('Add one node. Node is equal to the head', () => {
    const node = lruList.createNode('test key')
    expect(lruList.list.head.value.key).toEqual('test key')
    expect(node.value.key).toEqual('test key')
    expect(lruList.list.head.value.payload).toEqual(null)
    expect(node.value.payload).toEqual(null)
  })

  test('Add two nodes. Equal to the head and tail correspondingly', () => {
    const firstNode = lruList.createNode('first key')
    expect(lruList.list.tail.value.key).toEqual('first key')
    expect(lruList.list.tail.value.payload).toEqual(null)
    expect(firstNode.value.key).toEqual('first key')
    expect(firstNode.value.payload).toEqual(null)

    const secondNode = lruList.createNode('second key')
    expect(lruList.list.head.value.key).toEqual('second key')
    expect(lruList.list.head.value.payload).toEqual(null)
    expect(secondNode.value.key).toEqual('second key')
    expect(secondNode.value.payload).toEqual(null)
  })

  test('The last node should be removed if not enough space left', () => {
    lruList.createNode('first key')
    lruList.createNode('second key')
    lruList.createNode('third key')
    lruList.createNode('forth key')

    expect(lruList.list.tail.value.key).toEqual('second key')
    expect(lruList.list.tail.value.payload).toEqual(null)
  })

  test('Node should be moved to the head', () => {
    const firstNode = lruList.createNode('first key')
    lruList.createNode('second key')
    lruList.createNode('third key')
    lruList.moveNodeToHead(firstNode)

    expect(lruList.list.head.value.key).toEqual('first key')
    expect(lruList.list.head.value.payload).toEqual(null)
  })

  test("Node shouldn't be obsolete", async () => {
    const firstNode = lruList.createNode(
      'first key',
      'dummy payload for the first entity'
    )
    expect(lruList.isObsoleteNode(firstNode)).toBeFalsy()
  })

  test('Node should be obsolete', async () => {
    const firstNode = lruList.createNode(
      'first key',
      'dummy payload for the first entity'
    )
    await setTimeout(1500)
    expect(lruList.isObsoleteNode(firstNode)).toBeTruthy()
  })

  test('Node should be updated and moved to the head', () => {
    const firstNode = lruList.createNode(
      'first key',
      'dummy payload for the first entity'
    )
    lruList.createNode('second key', 'dummy payload for the second entity')
    lruList.updateNode(firstNode, 'updated dummy payload for the first entity')

    expect(lruList.list.head.value.key).toEqual('first key')
    expect(lruList.list.head.value.payload).toEqual(
      'updated dummy payload for the first entity'
    )
  })
})
