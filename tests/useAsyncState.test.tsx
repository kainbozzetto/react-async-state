import {render} from '@testing-library/react';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
    asyncSuccessMethod,
    asyncFailureMethod,
    TestComponent,
} from './TestComponent';
import {
    createServerStore,
    encodeStore,
    useNewStore,
} from '../src/index';

describe('useAsyncState', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('server side rendering works fine on success', () => {
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncSuccessMethod}/>
        )
        expect(html).toEqual('<span>success!</span>')
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
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncFailureMethod}/>
        )
        expect(html).toEqual('<span>error!</span>')
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

    test('components load success state from store on initial render', () => {
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncSuccessMethod}/>
        );
        document.documentElement.innerHTML = `
            <body data-state="${encodeStore(store)}">
                <div id="app">${html}</div>
            </body>
        `;

        useNewStore();
        const setState = jest.fn();
        const useStateSpy = jest.spyOn(React, 'useState')
        const useStateMock: any = (init: any) => [init, setState]
        useStateSpy.mockImplementation(useStateMock);

        render(
            <TestComponent method={asyncSuccessMethod}/>,
            {
                container: document.getElementById('app'),
                hydrate: true,
            },    
        )
        expect(useStateSpy).toHaveBeenCalledTimes(1);
        expect(useStateSpy).toHaveBeenCalledWith({
            result: 'success!',
            error: null,
            loading: false,
        });
        expect(setState).toHaveBeenCalledTimes(0);
        expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>success!</span></div>')
    });

    test('components load error state from store on initial render', () => {
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncFailureMethod}/>
        );
        document.documentElement.innerHTML = `
            <body data-state="${encodeStore(store)}">
                <div id="app">${html}</div>
            </body>
        `;

        useNewStore();
        const setState = jest.fn();
        const useStateSpy = jest.spyOn(React, 'useState')
        const useStateMock: any = (init: any) => [init, setState]
        useStateSpy.mockImplementation(useStateMock);

        render(
            <TestComponent method={asyncFailureMethod}/>,
            {
                container: document.getElementById('app'),
                hydrate: true,
            },    
        )
        expect(useStateSpy).toHaveBeenCalledTimes(1);
        expect(useStateSpy).toHaveBeenCalledWith({
            result: null,
            error: 'error!',
            loading: false,
        });
        expect(setState).toHaveBeenCalledTimes(0);
        expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>error!</span></div>')
    });
});