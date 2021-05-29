/* 2.1 */

import { keys, reject } from "ramda"

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}

type Store<K,V> = {
    keys: K[],
    vals: V[]
}

const makeEmptyStore = <K,V> (): Store<K,V> => ({keys:[], vals:[]}) 

const swapAndPop = <K> (array:K[], index:number): void => {
    array[index] = array[array.length -1]
    array.pop()
}

export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    const store = makeEmptyStore<K,V>();
    return {
        get(key: K) {
            return store.keys.includes(key) ? Promise.resolve(store.vals[store.keys.indexOf(key)])
                                            : Promise.reject(MISSING_KEY);
        },
        set(key: K, value: V) {
            store.keys.includes(key) ? store.vals[store.keys.indexOf(key)] = value 
                                    : (store.keys.push(key),
                                        store.vals.push(value))
            
            return Promise.resolve();
        },
        delete(key: K) {
            store.keys.includes(key) 
            ? (swapAndPop(store.vals,store.keys.indexOf(key)),
                swapAndPop(store.keys,store.keys.indexOf(key)))
                : Promise.reject(MISSING_KEY);
            return Promise.resolve();
        },
    }
}

// export function getAll<K, V>(pStore: PromisedStore<K, V>, keysList:K[]):Promise<V[]> {
//     const vals: V[] = [];
//     const auxGetAll = (pStore: PromisedStore<K, V>, keysList:K[]): void => {
//         keysList.length > 0 ? 
//             (pStore.get(keysList[0])
//                 .then((v: V) => {
//                     console.log("%j", v);
//                     vals.push(v);
//                     console.log("vals are %j", vals);

//                     auxGetAll(pStore, keysList.slice(1));
//                 }).catch(() => [MISSING_KEY])) :vals
//                 console.log("vals end case are %j", vals)
//     }
//     console.log("vals before call are %j", vals)
//     auxGetAll(pStore, keysList);
//     console.log("vals 0 case are %j", vals)
//     return Promise.resolve(vals);
// }

// const auxGetAll = <K,V>(pStore: PromisedStore<K, V>, keysList:K[], vals: V[]): V[] => {
//     keysList.length === 0 ? []
//        : (pStore.get(keysList[0])
//             .then((v: V) => {
//                 vals.push(v);
//                 auxGetAll(pStore, keysList.slice(1), vals);
//             }).catch(() => [MISSING_KEY]));
//     return vals; 
// }

/* 2.2 */


// const checkAndSet =  async <T,R>(store: PromisedStore<T,R>, param: T, f: (param: T) => R): Promise<R> => 
//     store.get(param)
//             .then(
//                 ((res) => res),
//                 ((rej) => {
//                     const val = f(param);
//                     store.set(param, val);
//                     return val;
//                 }))

const checkAndSet =  async <T,R>(store: PromisedStore<T,R>, param: T, val: R): Promise<R> => 
    store.get(param)
            .then(
                ((res) => res),
                ((rej) => {
                    store.set(param, val);
                    return val;
                }))

const returnVal = <T,R>(f: (param: T) => R): (param: T) => R => 
    (param: T) => f(param)



export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store = makePromisedStore<T,R>();
    const func = returnVal(f)
    return async (x: T): Promise<R> => {
        return await checkAndSet(store, x, func(x))
    }
    

// export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
//     const store = makePromisedStore<T,R>();
//     const originalF = async (p: T) => f(p)

//     return async (x: T): Promise<R> => {
//         const val = f(x)
//         return await checkAndSet(store, x, f)
//     }
    


  
}


/* 2.3 */

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (val: T) => boolean): () => Generator<T> {
    return function* tmp () {
        for (let gen of genFn()) {
            if (filterFn(gen)) {
                yield gen
            } 
        }

        }
    }
    
    



// export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: ???): ??? {
//     ???
// }

/* 2.4 */
// you can use 'any' in this question

// export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...(???)[]]): Promise<any> {
//     ???
// }