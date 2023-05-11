# 🔗 Seqness

is a simple javascript app state manager. Has Typescript support out of the box.

- [Installation](#installation)
- [Documentation](#documentation)
  - [Units](#units)
    - [Store](#store)
    - [Event](#event)
  - [Chain](#chain)
    - [chain.to](#chain.to)
    - [chain.transform](#chain.transform)
    - [chain.validate](#chain.validate)

## Installation

> You can use any package manager

```bash
npm add seqness
```

## Documentation

### Units

#### Store

The main data storage. The state is updated if the new value is not equal to the current. (`!==`)

You can **create** a store like

```javascript
const store = createStore('default')
```

#### Event

An event that registers the intention to transfer data from one source to another. It can be called as a regular function, or in event chain methods.

You can **create** event like

```javascript
const event = createEvent()
```

And you can **call** like

```javascript
event('somathing')
```

#### Thunk

Almost none of the modern web applications can do without asynchronous calls. Thunk provides an opportunity to do something, for example, send a request to the server and get data.

You can **create** thunk like

```javascript
async function doSomething(value) {
  return await fetch(/* some source */)
}

const thunk = createThunk(doSomething)
```

Thunk has preset events

- **pending** - Indicates that Thunk is in the process of execution (`Boolean`)
- **error** - The event that will trigger in case of an error with the received arguments

### Chain

Binds units into a unidirectional data stream to the final recipient. When initializing the chain, a unit is passed, the change of which will trigger the chain of events. If the unit is inside the chain, then changing it will not start the chain, but you can subscribe to each unit from the chain separately, both in the initialization of a separate chain, and by the `subscribe`

**Initialization**

```javascript
chain(somethingUnit)
// or chainFromData is initialized from any data. Such a chain can be started by calling the trigger
chainFromData('something').trigger()
```

#### chain.to

Method that delivers data from the previous source to the current one. Take a Unit or an array of Units

```
to(unit: Unit<T> | Unit<any>[])
```

**Example**

```javascript
const event = createEvent()
const store = createStore()

chain(event).to(store)
```

#### chain.transform

Converts the data received from the previous source. The first argument takes the handler function, the second argument is an array of dependencies units

```
transform(fn: (value: Value, ...args: any[]) => ReturnValue, deps: Unit<any>[])
```

**Example**

```javascript
const event = createEvent()
const store = createStore()

chain(event)
  .transform((eventValue, storeValue) => eventValue + storeValue, [storeValue])
  .to(store)
```

#### chain.validate

Validates the data received from the previous source in the chain. Accepts a handler function and an array of dependencies. If the handler response is `false`, the chain will stop executing.

```
validate(fn: (value: Value, ...args: any[]) => boolean, deps: Unit<any>[])
```

```javascript
const event = createEvent()
const store = createStore()

chain(event)
  .validate((value) => value > 0)
  .to(store)
```

#### chain.spread

Splits data into different sources creating new chains. Multiple circuits can be initialized. Take a handler function and a schema object that contains keys and functions with a chain

```
interface SpreadScheme {
  [key: string]: (chain: Chain) => Chain
}
interface ReturnKeyWithData{
  [key: string]: any
}

spread(fn: (value: Value) => ReturnKeyWithData, scheme: SpreadScheme)
```

```javascript
const event = createEvent()
const store = createStore()
const otherStore = createStore()

chain(event).spread(
  (value) => {
    if (value > 0) {
      return { done: true }
    } else {
      return { fail: true }
    }
  },
  {
    done: (chain) => chain.to(store),
    fail: (chain) => chain.to(otherStore)
  }
)
```
