import { beforeEach, expect, jest } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { DelaylessLruCache } from '../src/delayless-lru-cache.js'

describe('Delayless lru cache tests', () => {
  let delaylessLruCache

  beforeEach(() => {
    delaylessLruCache = new DelaylessLruCache({
      duration: 2,
      maxEntriesAmount: 3,
    })
  })

  test('Task should be called', async () => {
    const dummyTask = jest.fn(async () => 'dummy response')
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    delaylessLruCache.get('test key')
    const returnedValue = await dummyTask.mock.results[0].value
    expect(returnedValue).toEqual('dummy response')
    expect(dummyTask).toHaveBeenCalledTimes(1)
  })

  test('Initial payload retrieving', async () => {
    const dummyTask = async () => 'dummy response'
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    const firstPromise = delaylessLruCache.get('test key')
    const secondPromise = delaylessLruCache.get('test key')
    expect(delaylessLruCache.isTaskRunning('test key')).toBeTruthy()

    const result = await Promise.all([firstPromise, secondPromise])
    expect(result).toEqual(
      expect.arrayContaining(['dummy response', 'dummy response'])
    )
    expect(delaylessLruCache.isTaskRunning('test key')).toBeFalsy()
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

  test('Stale should be retrieved in a case of error', async () => {
    let counter = 0
    const dummyTask = async () => {
      if (counter === 1) {
        throw new Error('Something went wrong')
      }
      return `dummy response ${counter}`
    }
    const errorHandler = jest.fn()
    delaylessLruCache.setTaskOnce('test key', dummyTask, errorHandler)
    const firstPayload = await delaylessLruCache.get('test key')
    expect(firstPayload).toEqual('dummy response 0')

    counter++
    await setTimeout(3000)

    const secondPayload = await delaylessLruCache.get('test key')
    expect(secondPayload).toEqual('dummy response 0')
    await Promise.resolve() // This line should be here. We should run our expects after error handler will be called
    expect(errorHandler.mock.calls[0][0].message).toEqual(
      'Something went wrong'
    )
    expect(errorHandler.mock.calls[0][1]).toEqual('test key')
    expect(errorHandler).toHaveBeenCalledTimes(1)
  })

  test('Check resources cleaning', async () => {
    const arraySize = 700
    const promises = [...Array(arraySize).keys()].map((k) => {
      let dummyTask
      dummyTask = k === arraySize - 100 ?
        jest.fn(async () => `dummy response ${k}`) :
        jest.fn(async () => {throw new Error('Something went wrong')})
      delaylessLruCache.setTaskOnce(`test key ${k}`, dummyTask)
      return delaylessLruCache.get(`test key ${k}`)
    })

    Promise.all(promises).then(() => {
      expect(delaylessLruCache.tasks.size).toEqual(3)
      expect(delaylessLruCache.list.length).toEqual(3)
      expect(delaylessLruCache.runningTasks.size).toEqual(0)
    }).catch(() => {
      expect(delaylessLruCache.tasks.size).toEqual(3)
      expect(delaylessLruCache.list.length).toEqual(3)
      expect(delaylessLruCache.runningTasks.size).toEqual(0)
    })
  })
})
