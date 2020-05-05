import {useEffect, useState} from 'react';

declare global {
    interface Window {
        state: {
            [index: number]: any
        }
    }
}

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

  constructor({isServer}: {isServer?: boolean} = {}) {
    this.isServer = isServer;
  }
}

export function _useAsyncState(
  store: Store,
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
  }
) : [asyncData, Function] {
  const id = store.componentId++;
  let data: asyncData;
  if(store.isServer) {
    let done = false;
    const syncCallback = async function() {
      try {
        data = {
          result: await callback(),
          error: null,
          loading: false,
        };
      } catch(error) {
        data = {
          result: defaultState,
          error,
          loading: false,
        };
      }
      done = true;
    }
    syncCallback();
    const deasync = require('deasync');
    if(loop) {
      deasync.loopWhile(() => !done);
    } else {
      while(!done) {
        deasync.sleep(sleep);
      }
    }
    store.components[id] = data;
    return useState(data);
  } else {
      let state: [
          asyncData,
          Function,
      ];
      let loaded = false;
      if(document.body.dataset.state) {
        store.components = decodeStore(document.body.dataset.state);
        document.body.removeAttribute('data-state');
      }
      if(store.components[id]) {
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
        async function newCallback() {
          let data: asyncData;
          state[1]({
            result: defaultState,
            error: null,
            loading: true
          });
          try {
            data = {
              result: await callback(),
              error: null,
              loading: false,
            };
          } catch(error) {
            data = {
              result: defaultState,
              error,
              loading: false,
            };
          }
          state[1](data);
        }
        if(!loaded) {
          newCallback();
        }
      }, []); 
      return state;
  }
}

export const store = new Store();

export const useAsyncState = _useAsyncState.bind(null, store);

export function useNewStore() {
  module.exports.useAsyncState = _useAsyncState.bind(null, new Store());
}

export function createServerStore() {
  const store = new Store({isServer: true})
  module.exports.useAsyncState = _useAsyncState.bind(null, store);
  return store;
}
  
export function encodeStore(decodedStore: Store) {
  return Buffer.from(JSON.stringify(decodedStore.components)).toString('base64');
}

export function decodeStore(encodedStore: string) {
  return JSON.parse(atob(encodedStore));
}
