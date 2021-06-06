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


/* 2.2 */
const checkAndSet =  async <T,R>(store: PromisedStore<T,R>, param: T, val: R): Promise<R> => 
    store.get(param)
            .then(
                ((res) => res),
                ((rej) => {
                    store.set(param, val);
                    return val;
                }))


export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store = makePromisedStore<T,R>();
    
    return async (x: T): Promise<R> => {
        return await checkAndSet(store, x, f(x))
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
  const [first, ...rest] = fns;
  let val;

  val = await try3Times(first, undefined);

  for (let j = 0; j < fns.length; j++) {
    try {
      val = await try3Times(rest[0], val);
    } catch (err) {
      return err;
    }
  }

  return val;
}
async function wait () : Promise<any> {
  return new Promise ((resolve) => setTimeout(resolve, 2000))
}

async function try3Times(f: (param: any) => Promise<any>, param: any): Promise<any> {
  let i, val;
  for (i = 0; i < 3; i++) {
    try {
      val = await f(param);
      break;
    } catch (err) {
      if (i === 2) {
        throw err
      }
      await wait();
    }
  }
  return await val;
}