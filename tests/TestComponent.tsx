import React, {FunctionComponent, Component} from 'react';

import {useAsyncState, asyncData} from '../src/index';

interface TestComponentProps {
    method: Function,
}

export async function asyncSuccessMethod() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('success!');
        }, 50);
    });
}

export async function asyncFailureMethod() {
    return new Promise((resolve, reject) => {
        setTimeout(reject, 50);
    });
}

export const TestComponent:FunctionComponent<TestComponentProps> = ({method}) => {
    const [data, getData] = useAsyncState(
        null,
        method,
    );

    return (
        <>
            {data.loading && <span>Loading</span>}
            {data.result && <span>{data.result}</span>}
            {data.error && <span>{'error!'}</span>}
        </>
    );
}

export class Wrapper extends React.Component {
    render() {
        return this.props.children;
    }
}