import { LruCache } from '../src/lru-cache.js'
import { setTimeout } from 'timers/promises'

let counter = 1
const task = async () => {
  await setTimeout(5000)
  return counter
}
const cache = new LruCache(5, 3)
cache.setTaskOnce('test', task)
const value = await cache.get('test')

console.log('value: ', value)
counter++
await setTimeout(6000)

const value2 = await cache.get('test')
console.log('value2: ', value2)

await setTimeout(2000)

const value3 = await cache.get('test')
console.log('value3: ', value3)
