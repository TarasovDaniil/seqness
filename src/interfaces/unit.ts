export type Subscriber<T> = (value: T) => void
export type MayBe<T> = T | undefined
export type thunkFn<T, D> = (value: T) => Promise<D>

export interface Unit<Value> {
  subscribe(fn: Subscriber<MayBe<Value>>): void
  unsubscribe(fn: Subscriber<MayBe<Value>>): void
  getState(): MayBe<Value>
  setState(value: Value): void
}
