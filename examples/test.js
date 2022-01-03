import { DelaylessLruCache } from '..'
import { setTimeout } from 'timers/promises'

const delaylessLruCache = new DelaylessLruCache({
  duration: 2,
  maxEntriesAmount: 3,
})
const dummyTask = async () => 'dummy response'
let counter = 1
const tooLongTask = async () => {
  await setTimeout(3000)
  return `too long response`
}
delaylessLruCache.setTaskOnce('too long key', tooLongTask)
delaylessLruCache.setTaskOnce('first dummy key', dummyTask)
delaylessLruCache.setTaskOnce('second dummy key', dummyTask)
delaylessLruCache.setTaskOnce('third dummy key', dummyTask)
delaylessLruCache.setTaskOnce('first dummy key!', dummyTask)
delaylessLruCache.setTaskOnce('second dummy key!', dummyTask)
delaylessLruCache.setTaskOnce('third dummy key!', dummyTask)

await delaylessLruCache.get('too long key')
await delaylessLruCache.get('second dummy key')
await delaylessLruCache.get('third dummy key')
const r = await Promise.all([
  delaylessLruCache.get('too long key'),
  delaylessLruCache.get('first dummy key!'),
  delaylessLruCache.get('second dummy key!'),
  delaylessLruCache.get('third dummy key!'),
  new Promise(async (resolve) => {
    await setTimeout(100)
    let v
    try {
      v = await delaylessLruCache.get('too long key')
    } catch (e) {
      console.log('opss')
    }
    resolve(v)
  }),
])

console.log(r)
