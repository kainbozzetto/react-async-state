import { act, render } from '@testing-library/react';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  asyncSuccessMethod,
  asyncFailureMethod,
  ParentTestComponent,
  TestComponent,
} from './TestComponent';
import {
  createStore,
  encodeStore,
} from '../index';

describe('useAsyncState', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('server side rendering works fine on success', () => {
    const store = createStore();
    const html = ReactDOMServer.renderToString(
      <TestComponent method={asyncSuccessMethod} />,
    );
    expect(html).toEqual('<span>success!</span>');
    expect(store).toEqual({
      componentId: 1,
      isServer: true,
      components: {
        0: {
          result: 'success!',
          error: null,
          loading: false,
        },
      },
    });
  });

  test('server side rendering works fine on error', () => {
    const store = createStore();
    const html = ReactDOMServer.renderToString(
      <TestComponent method={asyncFailureMethod} />,
    );
    expect(html).toEqual('<span>error!</span>');
    expect(store).toEqual({
      componentId: 1,
      isServer: true,
      components: {
        0: {
          result: null,
          error: 'error!',
          loading: false,
        },
      },
    });
  });

  test('component loads success state from store on initial render', () => {
    const store = createStore();
    const html = ReactDOMServer.renderToString(
      <TestComponent method={asyncSuccessMethod} />,
    );
    document.documentElement.innerHTML = `
      <body data-state="${encodeStore(store)}">
        <div id="app">${html}</div>
      </body>
    `;

    createStore(false);
    const setState = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    const useStateMock: any = (init: any) => [init, setState];
    useStateSpy.mockImplementation(useStateMock);

    render(
      <TestComponent method={asyncSuccessMethod} />,
      {
        container: document.getElementById('app'),
        hydrate: true,
      },
    );
    expect(useStateSpy).toHaveBeenCalledTimes(1);
    expect(useStateSpy).toHaveBeenCalledWith({
      result: 'success!',
      error: null,
      loading: false,
    });
    expect(setState).toHaveBeenCalledTimes(0);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>success!</span></div>');
  });

  test('component loads error state from store on initial render', () => {
    const store = createStore();
    const html = ReactDOMServer.renderToString(
      <TestComponent method={asyncFailureMethod} />,
    );
    document.documentElement.innerHTML = `
      <body data-state="${encodeStore(store)}">
        <div id="app">${html}</div>
      </body>
    `;

    createStore(false);
    const setState = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    const useStateMock: any = (init: any) => [init, setState];
    useStateSpy.mockImplementation(useStateMock);

    render(
      <TestComponent method={asyncFailureMethod} />,
      {
        container: document.getElementById('app'),
        hydrate: true,
      },
    );
    expect(useStateSpy).toHaveBeenCalledTimes(1);
    expect(useStateSpy).toHaveBeenCalledWith({
      result: null,
      error: 'error!',
      loading: false,
    });
    expect(setState).toHaveBeenCalledTimes(0);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>error!</span></div>');
  });

  test('component loads success state from method on initial render', async () => {
    document.documentElement.innerHTML = `
      <body>
        <div id="app"></div>
      </body>
    `;

    createStore(false);
    const { useState } = React;
    const setStateSpy = jest.fn();
    const useStateMock: any = (data: any) => {
      const [state, setState] = useState(data);
      setStateSpy.mockImplementation(setState);
      return [state, setStateSpy];
    };
    const useStateSpy = jest.spyOn(React, 'useState').mockImplementation(
      useStateMock,
    );

    let promise : Promise<any>;
    const asyncSuccessMethodWrapper = jest.fn(
      () => {
        promise = asyncSuccessMethod();
        return promise;
      },
    );

    await act(async () => {
      render(
        <TestComponent method={asyncSuccessMethodWrapper} />,
        {
          container: document.getElementById('app'),
          hydrate: true,
        },
      );
    });

    // useState called initially and after useEffect
    expect(useStateSpy).toHaveBeenCalledTimes(2);
    expect(useStateSpy.mock.calls[0]).toEqual([{
      result: null,
      error: null,
      loading: false,
    }]);
    // setStateSpy in useEffect called once to set loading to be true
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(setStateSpy.mock.calls[0]).toEqual([{
      result: null,
      error: null,
      loading: true,
    }]);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>Loading</span></div>');

    await act(async () => {
      await promise;
    });
    // setStateSpy in useEffect after promise has been resolved
    expect(setStateSpy).toHaveBeenCalledTimes(2);
    expect(setStateSpy.mock.calls[1]).toEqual([{
      result: 'success!',
      error: null,
      loading: false,
    }]);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>success!</span></div>');
  });

  test('component loads error state from method on initial render', async () => {
    document.documentElement.innerHTML = `
      <body>
        <div id="app"></div>
      </body>
    `;

    createStore(false);
    const { useState } = React;
    const setStateSpy = jest.fn();
    const useStateMock: any = (data: any) => {
      const [state, setState] = useState(data);
      setStateSpy.mockImplementation(setState);
      return [state, setStateSpy];
    };
    const useStateSpy = jest.spyOn(React, 'useState').mockImplementation(
      useStateMock,
    );

    let promise : Promise<any>;
    const asyncFailureMethodWrapper = jest.fn(
      () => {
        promise = asyncFailureMethod();
        return promise;
      },
    );

    await act(async () => {
      render(
        <TestComponent method={asyncFailureMethodWrapper} />,
        {
          container: document.getElementById('app'),
          hydrate: true,
        },
      );
    });

    // useState called initially and after useEffect
    expect(useStateSpy).toHaveBeenCalledTimes(2);
    expect(useStateSpy.mock.calls[0]).toEqual([{
      result: null,
      error: null,
      loading: false,
    }]);
    // setStateSpy in useEffect called once to set loading to be true
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(setStateSpy.mock.calls[0]).toEqual([{
      result: null,
      error: null,
      loading: true,
    }]);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>Loading</span></div>');

    await act(async () => {
      try {
        await promise;
      } catch (e) {
        // no need to handle error
      }
    });

    // setStateSpy in useEffect after promise has been resolved
    expect(setStateSpy).toHaveBeenCalledTimes(2);
    expect(setStateSpy.mock.calls[1]).toEqual([{
      result: null,
      error: 'error!',
      loading: false,
    }]);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>error!</span></div>');
  });

  test('nested components load state from store on initial render', () => {
    const store = createStore();
    const html = ReactDOMServer.renderToString(
      <ParentTestComponent />,
    );
    document.documentElement.innerHTML = `
      <body data-state="${encodeStore(store)}">
        <div id="app">${html}</div>
      </body>
    `;

    createStore(false);
    const setState = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    const useStateMock: any = (init: any) => [init, setState];
    useStateSpy.mockImplementation(useStateMock);

    render(
      <ParentTestComponent />,
      {
        container: document.getElementById('app'),
        hydrate: true,
      },
    );
    expect(useStateSpy).toHaveBeenCalledTimes(2);
    // ParentTestComponent
    expect(useStateSpy.mock.calls[0]).toEqual([{
      result: true,
      error: null,
      loading: false,
    }]);
    // TestComponent
    expect(useStateSpy.mock.calls[1]).toEqual([{
      result: 'success!',
      error: null,
      loading: false,
    }]);
    expect(setState).toHaveBeenCalledTimes(0);
    expect(document.body.innerHTML.trim()).toEqual('<div id="app"><h1>Result:</h1><span>success!</span></div>');
  });
});
