import React, { ReactComponentElement, Dispatch } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import ReactTestUtils from 'react-dom/test-utils';
import { render } from '@testing-library/react';

import {
    asyncSuccessMethod,
    asyncFailureMethod,
    TestComponent,
    Wrapper,
} from './TestComponent';
import {createServerStore} from '../src/index';

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

    test('components load state on initial render', () => {
        const store = createServerStore()
        const html = ReactDOMServer.renderToString(
            <TestComponent method={asyncSuccessMethod}/>
        )
        document.body.innerHTML = `<html>
            <body data-state="${store}">
                <div id="app">${html}</div>
            </body>
        </html>`;

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

        // const tree = ReactDOM.hydrate(
        //     <Wrapper>
        //         <TestComponent method={asyncSuccessMethod}/>
        //     </Wrapper>,
        //     document.getElementById('app'),
        // ) as any;

        // console.log(tree)
        // ReactTestUtils.findRenderedComponentWithType(
        //     tree,
        //     TestComponent as any,
        // )
        expect(setState).toHaveBeenCalledWith(1);
    });
});