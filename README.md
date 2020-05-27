# React Async State [![Build Status](https://travis-ci.org/kainbozzetto/react-async-state.svg?branch=master)](https://travis-ci.org/kainbozzetto/react-async-state)

React Async State provides a hook that allows you to set state using asynchronous functions both in server-side rendering and in the browser.

### Installation

TODO

### Usage

React Async State provides the hook `useAsyncState` to replace the React hook `useState` when dealing with async data.

```javascript
useAsyncState(initial, callback)
```

Where `initial` is the same as initial state parameter passed through to the `useState` hook, and `callback` is the async function that will be called immediately to set update the state.

Note that the value that is set on state is an object with the keys `result`, `error` and `loading`. If `callback` was successful then the data returned from it will be set on `result`. If `callback` was unsuccesful then the data on the error is caught and set on `error`. While waiting for `callback` to resolve `loading` is set to `true`, and at all other times is `false`.

Let's look at an example where `callback` is successful.

```javascript
import useAsyncState from 'react-async-state';

const Welcome = () => {
  const [user, setUser] = useAsyncState(
    null,
    () => Promise.resolve('John'),
  );

  return (
    <>
      {user.loading && <span>Loading</span>}
      {user.result && <h1>Hi {user.result}</h1>}
      {user.error && <h3>Error: {user.error}</h3>}
    </>
  );
}
```

What we would expect in the above example that the `Welcome` component would render 'loading' until the promise was resolved at which point it would render 'Hi John'.

Let's look at a similar example, however this time an error is encountered.

```javascript
import useAsyncState from 'react-async-state';

const Welcome = () => {
  const [user, setUser] = useAsyncState(
    null,
    () => Promise.reject(new Error('User does not exist')),
  );

  return (
    <>
      {user.loading && <span>Loading</span>}
      {user.result && <h1>Hi {user.result}</h1>}
      {user.error && <h3>Error: {user.error}</h3>}
    </>
  );
}
```

Now what we would expect is that the `Welcome` component would render 'loading' until the promise was reject at which point it would render 'Error: User does not exist'.

The above examples show how this can be used purely in the client. The advantage of the `useAsyncState` hook is the ability to use it on the server where it can resolve `callback` during server side rendering. This means that the response from the server to the client will have the exact markup that the client would have after all async methods have resolved. Additionally, the state for all these components will be loaded correctly **without** running `callback` again on the client provided that you have properly configured your response (details below).

Let's assume we have a node web server set up with a basic function to handle the request looks something like below, where `bundle.js` contains your bundled javascript that contains React code that binds to `<div id="app"></div>`.

```javascript
(req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <script src="/static/bundle.js"></script>
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  `)
}
```

Let's assume that in `bundle.js` we are calling the following code:

```javascript
ReactDOM.render(<Welcome/>, document.getElementById('app'));
```

Traditionally if we were going to use server side rendering we'd use `hydrate` over `render`:

```javascript
ReactDOM.hydrate(<Welcome/>, document.getElementById('app'));
```

And also update the way we handle the response:

```javascript
(req, res) => {
  const html = ReactDOMServer.renderToString(<Welcome/>);
  
  res.send(`
    <!doctype html>
    <html>
      <head>
        <script src="/static/bundle.js"></script>
      </head>
      <body>
        <div id="app">${html}</div>
      </body>
    </html>
  `)
}
```

Even with our `Welcome` component calling `useAsyncState` it will first set the set the `user.result` to the default value provided (which is `null` in this case) and nothing will be rendered within the `div` we are mounting to as `html` will be an empty string. Once the browser runs the javascript the same process described above will take place, with the callback function being resolved and the value of `user` being updated re-rendering the component.

So just using `useAsyncState` in our components by itself doesn't allow us to properly render what the user would see after the initial mount. What would be ideal is if we could not only have `html` contain the markup that the user would see after the initial mount, but if we could also set the value of `user` on the `Welcome` component to be that which was calculated on the server during server side rendering.

What we can do is modify the function on the server to tell `useAsyncState` that we are on the server and therefore we want to wait until the callback function resolves before rendering. We also want to collect the internal state of the component and pass that through to the client so that it can load that state into the component when it is created. The way that we do this is by calling `createStore` and pass the store base64 encoded via a dataset attribute on `<body>`:

```javascript
import { createStore, encodeStore } from 'react-async-state';

(req, res) => {
  const store = createStore();
  const html = ReactDOMServer.renderToString(<Welcome/>);
  
  res.send(`
    <!doctype html>
    <html>
      <head>
        <script src="/static/bundle.js"></script>
      </head>
      <body data-state="${encodeStore(store)}">
        <div id="app">${html}</div>
      </body>
    </html>
  `)
}
```

The function `createStore` takes a parameter `isServer` that defaults to `true`, so in the above example we are creating a new store that we've said is on the server. This tells `useAsyncState` to wait for the callback it is given to resolve before rendering. After all the components have been rendered via `ReactDOM.renderToString` the `store` now contains the data we can send to the client so that it can load it into the components when they are first created. The way we send this data is through the `data-state` attribute on the `body` tag, as this is where the components will look up their state after decoding the store. What this means means is that any component using `useAsyncState` which was rendered on the server will not call their callback function to obtain state, rather simply take it from the store.

### Notes

This package uses `deasync` which is a controversial package to use in production environments.

There are plenty of articles out there that provide extensive reasons not to use it, for example [this article](https://joecreager.com/5-reasons-to-avoid-deasync-for-node-js/) covers quite a bit of detail.

Use `react-async-state` in production environments at your own risk. It is only being used here as a quick way to solve a complex problem.
