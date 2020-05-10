import React, {FunctionComponent} from 'react';

import {useAsyncState} from '../src/index';

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
        setTimeout(() => {
            reject('error!');
        }, 50);
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
            {data.error && <span>{data.error}</span>}
        </>
    );
}

export const ParentTestComponent:FunctionComponent = () => {
    const [data, getData] = useAsyncState(
        false,
        async () => {
            return await new Promise(
                (resolve) => {
                    setTimeout(() => resolve(true), 50)
                }
            );
        },
    );

    return (
        <>
            <h1>Result:</h1>
            {data.result && <TestComponent method={asyncSuccessMethod}/>}
        </>
    );
}


