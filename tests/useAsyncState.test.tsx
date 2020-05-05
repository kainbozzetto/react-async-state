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
    useDefaultStore,
} from '../src/index';

describe('useAsyncState', () => {
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
                    error: false,
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
                    error: true,
                    loading: false,
                },
            },
        });
    });

    test('components load state from store on initial render', () => {
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncSuccessMethod}/>
        );
        document.documentElement.innerHTML = `
            <body data-state="${encodeStore(store)}">
                <div id="app">${html}</div>
            </body>
        `;
        useDefaultStore();
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
            error: false,
            loading: false,
        });
        expect(setState).toHaveBeenCalledTimes(0);
        expect(document.body.innerHTML.trim()).toEqual('<div id="app"><span>success!</span></div>')
    });
});