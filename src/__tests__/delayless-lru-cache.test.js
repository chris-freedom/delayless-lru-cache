import { beforeEach, expect } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { DelaylessLruCache } from '../delayless-lru-cache.js'

describe('Delayless lru cache tests', () => {
  let delaylessLruCache

  beforeEach(() => {
    delaylessLruCache = new DelaylessLruCache({
      duration: 2,
      maxEntriesAmount: 3,
    })
  })

  test('Task should be set', () => {
    const dummyTask = async () => 'dummy response'
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    const { task, errorHandler } = delaylessLruCache.tasks.get('test key')
    expect(task).toEqual(dummyTask)
    expect(errorHandler).toBeUndefined()
  })

  test('Initial payload retrieving', async () => {
    const dummyTask = async () => 'dummy response'
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    const firstPromise = delaylessLruCache.get('test key')
    const secondPromise = delaylessLruCache.get('test key')
    expect(delaylessLruCache.runningTasks.size).toEqual(1)

    const result = await Promise.all([firstPromise, secondPromise])
    expect(result).toEqual(
      expect.arrayContaining(['dummy response', 'dummy response'])
    )
    expect(delaylessLruCache.runningTasks.size).toEqual(0)
    expect(delaylessLruCache.cache.has('test key')).toBeTruthy()

    const storedNode = delaylessLruCache.cache.get('test key')
    expect(storedNode.value.payload).toEqual('dummy response')
  })

  test('Cached payload should be revalidated', async () => {
    let counter = 0
    const dummyTask = async () => {
      counter++
      return `dummy response ${counter}`
    }
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    const firstPayload = await delaylessLruCache.get('test key')
    expect(firstPayload).toEqual('dummy response 1')
    await setTimeout(3000)

    const secondPayload = await delaylessLruCache.get('test key')
    expect(secondPayload).toEqual('dummy response 1')

    const thirdPayload = await delaylessLruCache.get('test key')
    expect(thirdPayload).toEqual('dummy response 2')
  })
})
