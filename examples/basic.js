import { DelaylessLruCache } from '..'
import { setTimeout } from 'timers/promises'

let counter = 1
const task = async () => {
  // await setTimeout(1000)
  return counter
}
const cache = new DelaylessLruCache({ duration: 5, maxEntriesAmount: 3 })
cache.setTaskOnce('test', task)
const value = await cache.get('test')

console.log('value: ', value)
counter++

await setTimeout(6000)

const value2 = await cache.get('test')
console.log('value2: ', value2)

// await setTimeout(1000)

const value3 = await cache.get('test')
console.log('value3: ', value3)
