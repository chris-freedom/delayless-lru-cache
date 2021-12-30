import { beforeEach, expect } from '@jest/globals'
import { DelaylessLruCache } from '../delayless-lru-cache'
import { setTimeout } from 'timers/promises'

describe('Delayless lru cache tests', () => {
  let delaylessLruCache

  beforeEach(() => {
    delaylessLruCache = new DelaylessLruCache({ duration: 2, maxEntriesAmount: 3 })
  })

  test('Task should be set', () => {
    const dummyTask = async () => 'dummy response'
    delaylessLruCache.setTaskOnce('test key', dummyTask)
    const { task, errorHandler } = delaylessLruCache.tasks.get('test key')
    expect(task).toEqual(dummyTask)
    expect(errorHandler).toBeUndefined()
  })
})