import { useEffect, useState } from 'react';

export interface AsyncData {
  result: unknown;
  error: unknown;
  loading: boolean;
}

export interface ComponentsObj {
  [index: number]: AsyncData;
}

export class Store {
  componentId = 0;

  isServer = false;

  components: ComponentsObj = {};

  constructor({ isServer }: {isServer: boolean} = { isServer: false }) {
    this.isServer = isServer;
  }
}

export function encodeStore(decodedStore: Store): string {
  return Buffer.from(JSON.stringify(decodedStore.components)).toString('base64');
}

export function decodeStore(encodedStore: string): ComponentsObj {
  return JSON.parse(atob(encodedStore));
}

function unboundUseAsyncState(
  boundStore: Store,
  defaultState: unknown,
  callback: Function,
  {
    loop,
    sleep,
  }:
  {
    loop: boolean;
    sleep: number;
  } = {
    loop: false,
    sleep: 10,
  },
): [AsyncData, Function] {
  const store = boundStore;
  const id = store.componentId;
  store.componentId += 1;
  let data: AsyncData;
  if (store.isServer) {
    let done = false;
    (async (): Promise<void> => {
      try {
        data = {
          result: await callback(),
          error: null,
          loading: false,
        };
      } catch (error) {
        data = {
          result: defaultState,
          error: error.message,
          loading: false,
        };
      }
      done = true;
    })();
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
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
    AsyncData,
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
      (async (): Promise<void> => {
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
            error: error.message,
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

export function createStore(isServer = true): Store {
  const newStore = new Store({ isServer });
  module.exports.useAsyncState = unboundUseAsyncState.bind(null, newStore);
  return newStore;
}
