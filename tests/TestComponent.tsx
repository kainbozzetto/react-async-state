import PropTypes from 'prop-types';
import React, { FunctionComponent } from 'react';

import { useAsyncState } from '../src/index';

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

export const TestComponent:FunctionComponent<TestComponentProps> = ({ method }) => {
  const [data] = useAsyncState(
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
};
TestComponent.propTypes = {
  method: PropTypes.func.isRequired,
};

export const ParentTestComponent:FunctionComponent = () => {
  const [data] = useAsyncState(
    false,
    () => new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    }),
  );

  return (
    <>
      <h1>Result:</h1>
      {data.result && <TestComponent method={asyncSuccessMethod} />}
    </>
  );
};
