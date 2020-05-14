import { useEffect, useState } from 'react';

export interface asyncData {
  result: any,
  error: any,
  loading: boolean,
}

export class Store {
  componentId: number = 0;

  isServer: boolean = false;

  components: {
    [index: number]: asyncData
  } = {};

  constructor({ isServer }: {isServer: boolean} = { isServer: false }) {
    this.isServer = isServer;
  }
}

export function encodeStore(decodedStore: Store) {
  return Buffer.from(JSON.stringify(decodedStore.components)).toString('base64');
}

export function decodeStore(encodedStore: string) {
  return JSON.parse(atob(encodedStore));
}

function unboundUseAsyncState(
  boundStore: Store,
  defaultState: any,
  callback: Function,
  {
    loop,
    sleep,
  } :
  {
    loop: boolean,
    sleep: number,
  } = {
    loop: false,
    sleep: 10,
  },
) : [asyncData, Function] {
  const store = boundStore;
  const id = store.componentId;
  store.componentId += 1;
  let data: asyncData;
  if (store.isServer) {
    let done = false;
    (async () => {
      try {
        data = {
          result: await callback(),
          error: null,
          loading: false,
        };
      } catch (error) {
        data = {
          result: defaultState,
          error,
          loading: false,
        };
      }
      done = true;
    })();
    // eslint-disable-next-line global-require
    const deasync = require('deasync');
    if (loop) {
      deasync.loopWhile(() => !done);
    } else {
      while (!done) {
        deasync.sleep(sleep);
      }
    }
    store.components[id] = data;
    return useState(data);
  }
  let state: [
    asyncData,
    Function,
  ];
  let loaded = false;
  if (document.body.dataset.state) {
    store.components = decodeStore(document.body.dataset.state);
    document.body.removeAttribute('data-state');
  }
  if (store.components[id]) {
    state = useState(store.components[id]);
    loaded = true;
  } else {
    state = useState({
      result: defaultState,
      error: null,
      loading: false,
    });
  }
  useEffect(() => {
    if (!loaded) {
      (async () => {
        state[1]({
          result: defaultState,
          error: null,
          loading: true,
        });
        try {
          data = {
            result: await callback(),
            error: null,
            loading: false,
          };
        } catch (error) {
          data = {
            result: defaultState,
            error,
            loading: false,
          };
        }
        state[1](data);
      })();
    }
  }, []);
  return state;
}

export const store = new Store();

export const useAsyncState = unboundUseAsyncState.bind(null, store);

export function createStore(isServer = true) {
  const newStore = new Store({ isServer });
  module.exports.useAsyncState = unboundUseAsyncState.bind(null, newStore);
  return newStore;
}
