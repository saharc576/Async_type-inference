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

export async function singletonByStore<X, Y>(x: X, y: Y, store: PromisedStore<X, Y>): Promise<Y> {
  return await store.get(x).then(
    (res) => res,
    (rej) => store.set(x, y).then((res) => store.get(x))
  )
}

/* 2.2 */
export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
  const store = makePromisedStore<T, R>()
  return async (x: T) => {
    // this function acts like if statement:
    return await store.get(x).then(
      // if [x][f(x)] is already exist than return (x) => const f(x)
      (res) => res,
      // else insert [x][f(x)] to the store and return (x) => const f(x)
      (rej) => store.set(x, f(x)).then((res) => store.get(x))
    )
  }
}

// export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
//   const store = makePromisedStore<T, R>()
//   const storeF = makePromisedStore<(param: T) => R, (param: T) => R>()

//   return async (x: T) => {
//     return await storeF.get(f).then(
//       (newf) =>
//         store.get(x).then(
//           // if [x][f(x)] is already exist than return (x) => const f(x)
//           (res) => res,
//           // else insert [x][f(x)] to the store and return (x) => const f(x)
//           () => store.set(x, newf(x)).then(() => store.get(x))
//         ),
//       (fNotExists) =>
//         storeF.set(f, f).then(() =>
//           storeF.get(f).then((newf) =>
//             store.get(x).then(
//               // if [x][f(x)] is already exist than return (x) => const f(x)
//               (res) => res,
//               // else insert [x][f(x)] to the store and return (x) => const f(x)
//               () => store.set(x, newf(x)).then(() => store.get(x))
//             )
//           )
//         )
//     )
//   }
//}

/* 2.3 */

// export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: ???): ??? {
//     ???
// }

// export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: ???): ??? {
//     ???
// }

/* 2.4 */
// you can use 'any' in this question

// export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...(???)[]]): Promise<any> {
//     ???
// }
