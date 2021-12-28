import { LruList } from '../lru-list.js'
import { beforeEach, expect } from '@jest/globals'
import { setTimeout } from 'timers/promises'

describe('Environment tests', () => {
  let lruList

  beforeEach(() => {
    lruList = new LruList(2, 3)
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
})
