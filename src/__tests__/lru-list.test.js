import { LruList } from '../lru-list.js'
import { beforeEach, expect, jest } from '@jest/globals'
import { setTimeout } from 'timers/promises'

describe('LRU list tests', () => {
  let lruList

  beforeEach(() => {
    lruList = new LruList({ duration: 2, maxEntriesAmount: 3 })
  })

  test('Add one node. Node is equal to the head', () => {
    const node = lruList.createNode('test key', 'dummy payload')
    expect(lruList.list.head.value.key).toEqual('test key')
    expect(node.value.key).toEqual('test key')
    expect(lruList.list.head.value.payload).toEqual('dummy payload')
    expect(node.value.payload).toEqual('dummy payload')
  })

  test('Add two nodes. Equal to the head and tail correspondingly', () => {
    const firstNode = lruList.createNode('first key', 'dummy payload for the first entity')
    expect(lruList.list.tail.value.key).toEqual('first key')
    expect(lruList.list.tail.value.payload).toEqual('dummy payload for the first entity')
    expect(firstNode.value.key).toEqual('first key')
    expect(firstNode.value.payload).toEqual('dummy payload for the first entity')

    const secondNode = lruList.createNode('second key', 'dummy payload for the second entity')
    expect(lruList.list.head.value.key).toEqual('second key')
    expect(lruList.list.head.value.payload).toEqual('dummy payload for the second entity')
    expect(secondNode.value.key).toEqual('second key')
    expect(secondNode.value.payload).toEqual('dummy payload for the second entity')
  })

  test('The last node should be removed if not enough space left', () => {
    lruList.createNode('first key', 'dummy payload for the first entity')
    lruList.createNode('second key', 'dummy payload for the second entity')
    lruList.createNode('third key', 'dummy payload for the third entity')
    lruList.createNode('forth key', 'dummy payload for the forth entity')

    expect(lruList.list.tail.value.key).toEqual('second key')
    expect(lruList.list.tail.value.payload).toEqual('dummy payload for the second entity')
  })

  test('Node should be moved to the head', () => {
    const firstNode = lruList.createNode('first key', 'dummy payload for the first entity')
    lruList.createNode('second key', 'dummy payload for the second entity')
    lruList.createNode('third key', 'dummy payload for the third entity')
    lruList.moveNodeToHead(firstNode)

    expect(lruList.list.head.value.key).toEqual('first key')
    expect(lruList.list.head.value.payload).toEqual('dummy payload for the first entity')
  })

  test('Node shouldn\'t be obsolete', async () => {
    const firstNode = lruList.createNode('first key', 'dummy payload for the first entity')
    expect(lruList.isObsoleteNode(firstNode)).toBeFalsy()
  })

  test('Node should be obsolete', async () => {
    const firstNode = lruList.createNode('first key', 'dummy payload for the first entity')
    await setTimeout(1500)
    expect(lruList.isObsoleteNode(firstNode)).toBeTruthy()
  })

  test('Node should be updated and moved to the head', () => {
    const firstNode = lruList.createNode('first key', 'dummy payload for the first entity')
    lruList.createNode('second key', 'dummy payload for the second entity')
    lruList.updateNode(firstNode, 'updated dummy payload for the first entity')

    expect(lruList.list.head.value.key).toEqual('first key')
    expect(lruList.list.head.value.payload).toEqual('updated dummy payload for the first entity')
  })
})
