/* 2.1 */

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

// export async function singletonByStore<X, Y>(x: X, y: Y, store: PromisedStore<X, Y>): Promise<Y> {
//   return await store.get(x).then(
//     (res) => res,
//     (rej) => store.set(x, y).then((res) => store.get(x))
//   )
// }

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
export function lazyFilter<T>(
  genFn: () => Generator<T>,
  filterFn: (x: T) => boolean
): () => Generator<T> {
  return function* tmp() {
    for (let gen of genFn()) {
      if (filterFn(gen)) {
        yield gen
      }
    }
  }


// export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: ??: ?? {
//  ???
// }

/* 2.4 */
// you can use 'any' in this question

// export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...(???)[]]): Promise<any> {
//     ???
// }
