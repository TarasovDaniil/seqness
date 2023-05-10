import { MayBe, Subscriber, thunkFn, Unit as UnitMain } from './interfaces/unit'

export class Unit<Value> implements UnitMain<Value> {
  constructor(defaultValue?: Value) {
    this.subscribers = []
    this.defaultValue = defaultValue
    this.currentValue = defaultValue
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
  reset(): void {
    this.currentValue = this.defaultValue
  }
}
// вообще здесь стоит создать ивены на получение данных в случае ошибки и ожидания получения данных
export class Thunk<Value, D> extends Unit<any> {
  thunkFn: thunkFn<Value, D>

  constructor(fn: thunkFn<Value, D>) {
    super()
    this.thunkFn = fn
  }

  setState(value: Value) {
    this.thunkFn(value).then((res) => {
      super.setState(res)
    })
  }
}
