import { Unit } from './unit'

interface Event<T> extends Unit<T> {
  (value: T): void
}

export function createEvent<T>() {
  const unit = new Unit<T>()
  const event = (value: T) => {
    unit.setState(value)
  }
  return Object.assign(event, {
    subscribe: unit.subscribe.bind(unit),

    unsubscribe: unit.unsubscribe.bind(unit),

    getState: unit.getState.bind(unit),

    setState: unit.setState.bind(unit)
  } as Event<T>)
}
