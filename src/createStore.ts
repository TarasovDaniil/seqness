import { Store } from './unit'

export function createStore<T>(value: T) {
  return new Store(value)
}
