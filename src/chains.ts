import { Unit } from './unit'
import { MayBe } from './interfaces/unit'

interface InnerChainsType {
  [key: string]: Chain
}

type OneOrMany<T> = T | [T, ...T[]]

type TransformFn<T, D> = (value: T, ...args: any[]) => D

interface TransformType<T = any, D = any> {
  operation: 'transform'
  fn: TransformFn<T, D>
  deps: Unit<any>[] | undefined
}

type SpreadFn<T> = (value: T) => SpreadReturn | false

interface SpreadReturn {
  [key: string]: any
}

interface SpreadScheme {
  [key: string]: (chain: Chain) => Chain
}

interface SpreadType<T = any> {
  fn: SpreadFn<T>
  scheme: SpreadScheme
}

type ValidateFn<T> = (value: T, ...args: any[]) => boolean

interface ValidateType<T = any> {
  operation: 'validate'
  fn: ValidateFn<T>
  deps: Unit<any>[] | undefined
}

class Chain<Value = unknown> {
  protected unit: Unit<Value> | undefined
  protected chains: (Unit<any> | TransformType | SpreadType | ValidateType)[]
  protected value: any
  protected innerChains: InnerChainsType
  protected isRunning: boolean

  constructor(unit?: Unit<Value>) {
    this.unit = unit
    this.unit?.subscribe(this.chainsRoadStart.bind(this))
    this.chains = []
    if (unit) {
      this.chains.push(unit)
    }
    this.innerChains = {}
    this.isRunning = false
  }

  trigger() {
    if (this.value !== undefined) {
      this.isRunning = true
      this.chainsSub(0, this.value)
    }
  }

  private chainsRoadStart(value: MayBe<Value>) {
    this.isRunning = true
    this.chainsSub(1, value)
  }

  private chainsSub<D>(nextIndex: number, value: MayBe<D>) {
    if (this.chains.length <= nextIndex) {
      this.isRunning = false
      return
    }
    if (!this.isRunning) return
    const chain = this.chains[nextIndex]
    if (chain instanceof Unit) {
      chain.setState(value)
    } else if ('operation' in chain) {
      if (chain.operation === 'transform') {
        const transform = chain as TransformType
        const val = transform.fn(
          value,
          ...(transform.deps?.map((unit) => unit.getState()) || [])
        )
        this.chainsSub(nextIndex + 1, val)
      } else if (chain.operation === 'validate') {
        const validate = chain as ValidateType
        if (
          !validate.fn(
            value,
            ...(validate.deps?.map((unit) => unit.getState()) || [])
          )
        ) {
          return
        }
        this.chainsSub(nextIndex + 1, value)
      }
    } else if ('scheme' in chain) {
      const spread = chain as SpreadType
      const scheme = spread.fn(value)
      if (scheme === false) {
        this.chainsSub(nextIndex + 1, value)
        return
      }
      Object.keys(scheme).forEach((element) => {
        if (!(element in spread.scheme)) {
          return
        }
        const innerChain = this.getChain(element, scheme[element])
        spread.scheme[element](innerChain).trigger()
      })
    }
  }

  private getChain<Val>(element: string, value: Val): Chain {
    if (element in this.innerChains) {
      return this.innerChains[element].updateData(value)
    }
    return Chain.fromData(value)
  }

  updateData<Val>(value: Val) {
    this.value = value
    return this
  }

  static fromData<Val>(value: Val) {
    return new Chain().updateData(value)
  }

  private chainsPush<B>(unit: Unit<B>) {
    this.chains.push(unit)
    unit.subscribe(this.chainsSub.bind(this, this.chains.length))
  }

  to<B>(unit: OneOrMany<Unit<B | any>>) {
    if (Array.isArray(unit)) {
      unit.forEach((item) => {
        this.chainsPush(item)
      })
    } else {
      this.chainsPush(unit)
    }
    return this
  }

  transform<T, D>(fn: TransformFn<T, D>, deps?: Unit<any>[]) {
    this.chains.push({ fn, deps, operation: 'transform' } as TransformType<
      T,
      D
    >)
    return this
  }

  spread<T>(fn: SpreadFn<T>, scheme: SpreadScheme) {
    this.chains.push({ fn, scheme } as SpreadType<T>)
    return this
  }

  validate<T>(fn: ValidateFn<T>, deps?: Unit<any>[]) {
    this.chains.push({ fn, deps, operation: 'validate' } as ValidateType<T>)
    return this
  }
}

export function chain<Value>(unit: Unit<Value>) {
  return new Chain(unit)
}

export function chainFromData<Value>(value: Value) {
  return Chain.fromData(value)
}
