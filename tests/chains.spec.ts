import 'mocha'
import { assert } from 'chai'

import {chain, createStore, createEvent, createThunk, chainFromData} from '../src'

describe('simple chain with event and transform', () => {
    const store = createStore<number>(1);
    const store2 = createStore<number>(1);
    const store3 = createStore<number>(1);
    const increment = createEvent<number>();
    const setValueEvent = createEvent<number>();
    const otherEvent = createEvent<string>();

    chain(increment).transform((inc: number, state) => state + inc, [store]).to(store);
    chain(setValueEvent).to(store2);
    chain(otherEvent).to(store3);

    it('increment store', (done) => {
        store.subscribe((state) => {
            assert.equal(state, 2);
            done()
        });
        increment(1);
    })

    it('setValueEvent call with new state', (done) => {
        store2.subscribe((state) => {
            assert.equal(state, 10);
            done()
        })
        setValueEvent(10);
    })

    it('otherEvent call with string. It is PROBLEM', (done) => {
        store3.subscribe((state) => {
            assert.equal<number | string | undefined>(state, 'store');
            done()
        })
        otherEvent('store');
    })
})

describe('chain with validate', () =>{
    const answer = createStore<number | undefined>(undefined)
    const setAnswer = createEvent<number>()
    const correctAnswer = createStore<number>(20)

    chain(setAnswer).validate((val, correct) => {
        return val === correct
    }, [correctAnswer]).to(answer)

    it('set incorrect answer', () => {
        answer.subscribe((state: number | undefined) => {
            assert.equal(state, 20)
        })
        setAnswer(10)
    })

    it('set correct answer', (done) => {
        answer.subscribe((state: number | undefined) => {
            assert.equal(state, 20)
            done()
        })
        setAnswer(20)
    })
})

describe('chain with thunk', () => {
    const store = createStore<number>(1);
    const store2 = createStore<string>('success');
    const event = createEvent<number>();

    async function asyncTimeout(value: number): Promise<number | string> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            setTimeout(() => {
                if(value > 0){
                    resolve(value * 2)
                }else{
                    reject('error')
                }
            }, 100);
        })
    }

    const asyncThunk = createThunk(asyncTimeout);

    chain(event).to(asyncThunk).to(store)
    chain(asyncThunk.error).to(store2)

    it('async event with timeout', (done) => {
        store.subscribe((state) => {
            assert.equal(state, 2);
            done();
        })
        event(1);
    })

    it('async event with error', (done) => {
        store2.subscribe((state) => {
            assert.equal(state, 'error')
            done()
        });
        event(0)
    })
})

describe('chain with spread', () => {
    const store = createStore<number>(0)
    const store2 = createStore<string>('')
    const event = createEvent<number>()

    chain(event).spread((value: number) => {
        if(value > 0) {
            return {
                'done': value
            };
        }
        else {
            return {
                'none': 'warning'
            }
        }
    }, {
        'done': (chain) => chain.to(store),
        'none': (chain) => chain.to(store2)
    })

    it('change store number', (done) => {
        store.subscribe((state) => {
            assert.equal(state, 5)
            done()
        })
        event(5)
    })

    it('change store with warning', (done) => {
        store2.subscribe((state) => {
            assert.equal(state, 'warning')
            done()
        })
        event(0)
    });
})

describe('chain with multi spread', () => {
    const countSignal = createStore<number>(0);
    const setSignal = createEvent<{type: string, data: string | number}>()
    const lastSignalX = createStore<string>('')
    const lastSignalY = createStore<number>(0)

    chain(setSignal).spread((value: {type: string, data: string | number}) => {
        let returnValue = {} as {x: string, y: number, signal: boolean};
        if(value.type === 'x'){
            returnValue.x = String(value.data);
        }else if(value.type === 'y'){
            returnValue.y = Number(value.data);
        }
        returnValue.signal = true;
        return returnValue;
    }, {
        x: (chain) => chain.to(lastSignalX),
        y: (chain) => chain.to(lastSignalY),
        signal: (chain) => chain.transform((_, count) => count + 1, [countSignal]).to(countSignal)
    })

    it('chain multi data', (done) => {
        lastSignalX.subscribe((state) => {
            assert.equal(state, '1234')
        })
        countSignal.subscribe((state) => {
            assert.equal(state, 1)
            done()
        })
        setSignal({type: 'x', data: '1234'})
    })
})

describe('chain from data', () => {
    const store = createStore<number>(1)

    const chain = chainFromData(20).to(store)

    it('chain from data trigger', (done) => {
        store.subscribe((state) => {
            assert.equal(state, 20)
            done()
        })

        chain.trigger()
    })
})