import { thunkFn } from './interfaces/unit'
import { Thunk } from './unit'

export function createThunk<T, D>(fn: thunkFn<T, D>) {
  return new Thunk(fn)
}
