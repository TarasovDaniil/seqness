import { MayBe, Subscriber, thunkFn, Unit as UnitMain } from './interfaces/unit'
import { createEvent, Event } from './createEvent'

export abstract class Unit<Value> implements UnitMain<Value> {
  constructor(defaultValue?: Value) {
    this.subscribers = []
    this.defaultValue = defaultValue
    if (defaultValue !== undefined) this.setState(defaultValue)
  }

  protected currentValue: MayBe<Value>
  protected defaultValue: MayBe<Value>
  protected subscribers: Subscriber<MayBe<Value>>[]

  subscribe(fn: Subscriber<MayBe<Value>>): void {
    this.subscribers.push(fn)
  }

  unsubscribe(fn: Subscriber<MayBe<Value>>): void {
    const idx = this.subscribers.findIndex((fns) => fns === fn)
    if (idx >= 0) {
      this.subscribers.splice(idx, 1)
    }
  }

  protected notify() {
    this.subscribers.forEach((fn) => {
      fn(this.currentValue)
    })
  }

  getState(): MayBe<Value> {
    return this.currentValue
  }

  setState(value: Value) {
    this.currentValue = value
    this.notify()
  }
}

export class Store<Value> extends Unit<Value> {
  constructor(defaultValue?: Value) {
    super(defaultValue)
  }

  setState(value: Value) {
    if (value !== this.currentValue) {
      super.setState(value)
    }
  }
}

export class Thunk<Value, D> extends Unit<any> {
  private readonly thunkFn: thunkFn<Value, D>
  pending: Event<boolean>
  error: Event<unknown>

  constructor(fn: thunkFn<Value, D>) {
    super()
    this.thunkFn = fn
    this.pending = createEvent<boolean>()
    this.error = createEvent<unknown>()
  }

  async setState(value: Value) {
    this.pending(true)
    try {
      const data = await this.thunkFn(value)
      super.setState(data)
    } catch (e) {
      this.error(e)
    } finally {
      this.pending(false)
    }
  }
}

export class EventType<T> extends Unit<T> {
  constructor() {
    super()
  }
}
