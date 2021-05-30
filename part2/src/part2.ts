/* 2.1 */

import { keys, reject } from "ramda"

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
  get(key: K): Promise<V>
  set(key: K, value: V): Promise<void>
  delete(key: K): Promise<void>
}

type Store<K, V> = {
  keys: K[]
  vals: V[]
}

const makeEmptyStore = <K, V>(): Store<K, V> => ({ keys: [], vals: [] })

const swapAndPop = <K>(array: K[], index: number): void => {
  array[index] = array[array.length - 1]
  array.pop()
}

export function makePromisedStore<K, V>(): PromisedStore<K, V> {
  const store = makeEmptyStore<K, V>()
  return {
    get(key: K) {
      return store.keys.includes(key)
        ? Promise.resolve(store.vals[store.keys.indexOf(key)])
        : Promise.reject(MISSING_KEY)
    },
    set(key: K, value: V) {
      store.keys.includes(key)
        ? (store.vals[store.keys.indexOf(key)] = value)
        : (store.keys.push(key), store.vals.push(value))

      return Promise.resolve()
    },
    delete(key: K) {
      store.keys.includes(key)
        ? (swapAndPop(store.vals, store.keys.indexOf(key)),
          swapAndPop(store.keys, store.keys.indexOf(key)))
        : Promise.reject(MISSING_KEY)
      return Promise.resolve()
    },
  }
}

export function concatPromises<V, K>(pA: Promise<V>, pArray: Promise<V[]>): Promise<V[]> {
  return pArray
    .then((res) => pA.then((v: V) => [v].concat(res)))
    .catch((reason) => Promise.reject(reason))
}

export function getAll<K, V>(pStore: PromisedStore<K, V>, keysList: K[]): Promise<V[]> {
  return keysList.length === 0
    ? Promise.reject(MISSING_KEY)
    : keysList.length === 1
    ? pStore.get(keysList[0]).then((res) => [res])
    : concatPromises(pStore.get(keysList[0]), getAll(pStore, keysList.slice(1)))
}


/* 2.2 singleton */
export function singletonStore<X, Y>(x: X, y: Y, store: PromisedStore<X, Y>): Promise<Y> {
  return store.get(x).then(
    (res) => res,
    (doesntExist) => store.set(x, y).then((voidReturned) => store.get(x).then((res) => res))
  )
}

export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
  const store = makePromisedStore<T, R>()
  const functionStore = makePromisedStore<(param: T) => R, (param: T) => R>()
  return async (x: T) => {
    const g = await singletonStore(f, f, functionStore)
    return singletonStore(x, g(x), store)
  }
}

/* 2.2 sub-functions*/
export async function get<T, R>(key: T, store: PromisedStore<T, R>): Promise<R> {
  return await store.get(key)
}

export async function set<T, R>(key: T, value: R, store: PromisedStore<T, R>): Promise<void> {
  return await store.set(key, value)
}

export function asycMemo2<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
  const store = makePromisedStore<T, R>()
  return (x: T) => {
    return get(x, store)
      .then((fx) => fx)
      .catch((valueDoesntExists) => {
        set(x, f(x), store)
        return get(x, store)
      })
  }
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
    
    



export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (val: T) => R): () => Generator<R> {
    return function* mapGen() {
        for (let val of genFn()) {
            yield mapFn(val);
        }
    }
}

/* 2.4 */
// you can use 'any' in this question

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((data:any) => Promise<any>)[]]): Promise<any> {


  const rec = async (fns: [() => Promise<any>, ...((data:any) => Promise<any>)[]], index: number):  Promise<any> => {
    if ( index === 0 ) {
      const p = new Promise<any> (async (resolve, reject): Promise<any> => {
        resolve = (data: any) => Promise.resolve(fns[0]())
        reject = (reason: any) => {
          setTimeout(() => {
            const p2 = new Promise<any> (async (resolve, reject): Promise<any> => {
              resolve = (data: any) => Promise.resolve(fns[0]())
              reject = (reason: any) => {
                setTimeout(() => {
                  const p3 = new Promise<any> (async (resolve, reject): Promise<any> => {
                    resolve = (data: any) => Promise.resolve(fns[0]())
                    reject = (reason: any) => Promise.reject(reason)
                return await p3
                  })
              }, 2000)
          }
        return await p2
        })
          }, 2000)
        } 
        return await p
      })
    return await p;

    } else {
      const val = await rec(fns, index - 1);
      const p = new Promise<any> (async (resolve, reject): Promise<any> => {
        resolve = (data: any) => Promise.resolve(fns[0]())
        reject = (reason: any) => {
          setTimeout(() => {
            const p2 = new Promise<any> (async (resolve, reject): Promise<any> => {
              resolve = (data: any) => Promise.resolve(fns[0]())
              reject = (reason: any) => {
                setTimeout(() => {
                  const p3 = new Promise<any> (async (resolve, reject): Promise<any> => {
                    resolve = (data: any) => Promise.resolve(fns[0]())
                    reject = (reason: any) => Promise.reject(reason)
                return await p3
                  })
              }, 2000)
          }
        return await p2
        })
          }, 2000)
        } 
        return await p
      })
    return await p;
    }
}
return await rec(fns, fns.length -1)
}

// const compose = (data: any, f: (data:any) => Promise<any>): Promise<any> => 
//   f(data)





// this implemtation works ONLY FIRST test

// const rec = async (fns: [() => Promise<any>, ...((data:any) => Promise<any>)[]], index: number):  Promise<any> => {
//     if ( index === 0 ) {
//         const val = await fns[index]()
//       .then(
//             (( res ) => res),
//           (async ( rej ) => 
//           setTimeout(async () => await fns[0]()
//                     .then(
//                         ((res2) => res2),
//                       (async (rej2) => 
  
//                       setTimeout(async () => fns[0]()
//                                 .then(
//                                     ((res3) => res3),
//                                     ((rej3) => rej3)), 2000) )), 2000) 
//             )
//         )
//         return val 
//       } else {
//           const val = await rec(fns, index - 1);
//       console.log("rec() else -> val", val)
  
//       const toReturn = await fns[index](val)
//         .then(
//           (( res ) => res),
//           (async ( rej ) => setTimeout(
//                             async () => await fns[index](val)
//                             .then( 
//                                   (( res2 ) => {console.log("rec() in res2 -> val", val); res2;}),
//                                   (async ( rej2 ) => setTimeout(
        
//                                                       async () => await fns[index](val)
//                                                       .then( 
//                                                             (( res3 ) => {console.log("rec() in res3 -> val", val); res3;}),
//                                                             (( rej3 ) => rej3)), 2000))), 2000)
//                 ))
//         console.log("toReturn", toReturn)
//         return toReturn
//     }
  
  // }
  // const onFirstRej = async (f0: () => Promise<any>, f: (data:any) => Promise<any>, index: number, prevRes: any) : Promise<any> => {
  //   if (index === 0) {
  //       return await f0()
        
  //   } else {    
  //       return await f(prevRes)
  //   }
  // }
  
  // const onFirstRej = async (f0: () => Promise<any>, f: (data:any) => Promise<any>, index: number, prevRes: any) : Promise<any> => {
  //   if (index === 0) {
  //       return await f0()
        
  //   } else {    
  //       return await f(prevRes)
  //   }
  // }