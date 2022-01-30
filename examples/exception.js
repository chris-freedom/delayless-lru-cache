import { DelaylessLruCache } from '../src/delayless-lru-cache.js'
import { setTimeout } from 'timers/promises'

let counter = 1
const task = async () => {
  console.log('api request', counter)
  if (counter === 2) {
    throw new Error('Something went wrong')
  }
  await setTimeout(1000)
  return counter
}
const cache = new DelaylessLruCache({ duration: 5, maxEntriesAmount: 3 })
cache.setTaskOnce('test', task, (err, key) => console.log(`logging error message: "${err.message}" for key "${key}"`))
const value = await cache.get('test')

console.log('value: ', value)
counter++

await setTimeout(6000)

const value2 = await cache.get('test')
console.log('value2: ', value2)

console.log(await cache.get('test'))
