# Delto

A JavaScript/TypeScript web framework for the [Node](https://nodejs.org) runtime built on top of the [ShapeX](https://github.com/tryshapex/shapex) event-driven application framework.

## Example application

```typescript
import { Delto, type DeltoState, type RouteParams } from "delto";

// Define app state
type AppState = DeltoState & {
  name: string | null;
};

// Create app instance with default state
const app = Delto<AppState>({
  name: null,
});

// Create routes that dispatch events
app.get("/hello/:who", "http.request.hello");

// Subscribe to events
app.subscribe(
  "http.request.hello",
  (state, params: RouteParams<{ who: string }>) => {
    return {
      state: {
        ...state,
        name: params.who,
      },
      dispatch: {
        to: "http.response.plain",
        with: {
          body: `Hello: ${params.who}`,
        },
      },
    };
  }
);

// Serve requests
app.serve({
  port: 3222,
});
```

## Installation

```shell
npm i delto
```

## Documentation

Delto does away with the classical MVC pattern for web backends and instead encourages the use of events and subscriptions. The idea being that if everything is an event or a subscription listening to an event, then it's easier to reason about the complexity of your application as you can focus on just that, without getting lost in the sea of terminology and different abstraction patterns. It's all just action and reaction.

### State

Much like using [ShapeX](https://github.com/tryshapex/shapex) on its own, at the core of your application is state. You start by initiating with some initial state, which is an intersection type of `DeltoState`:

```typescript
import { Delto, type DeltoState, type RouteParams } from "delto";

type AppState = DeltoState & {
  name: string | null;
};

const app = Delto<AppState>({
  name: null,
});
```

In other words, some of the state will be created and managed by Rose itself, which is `DeltoState`, and your state will be an addition to `DeltoState`.

### Routes

Routes in Delto dispatch [ShapeX events](https://github.com/tryshapex/shapex?tab=readme-ov-file#events). Routes are created like so:

```typescript
app.get("/hello/:who", "http.request.hello");
```

Route events will automatically get `RouteParams` passed to them, so if you subscribe to route events, you can receive the route params like so:

```typescript
app.subscribe(
  "http.request.hello",
  (state, params: RouteParams<{ who: string }>) => {
    return {
      state: {
        ...state,
        name: params.who,
      },
      dispatch: {
        to: "http.response.plain",
        with: {
          body: `Hello: ${params.who}`,
        },
      },
    };
  }
);
```

Notice the `RouteParams` type definition here, which supports generics so you can specify exactly what shape of data you expect to get. Other than that, all subscriptions are just like [ShapeX subscriptions](https://github.com/tryshapex/shapex?tab=readme-ov-file#subscriptions).

### Request information

Delto stores request information in the `http` state key, so to access request information you'd do something like this:

```typescript
app.subscribe("my-event", (state) => {
  // log pathname
  console.log(state.http?.request.url.pathname);

  return {};
});
```

The `http.request` state consists of the following information:

```typescript
export type DeltoRequest = {
  url: URL;
  method: string;
  body: unknown; // this differs based on runtime
};
```

### Built-in events

Delto comes with some built-in events.

#### Responses

You can dispatch response events to return data to the client. All responses must conform to the `DeltoResponse` type which looks like this:

```typescript
export type DeltoResponse = {
  body?: unknown; // this differs based on runtime
  status?: number;
  headers?: {
    [key: string]: string;
  };
};
```

##### `http.response.plain`

Return a plain response with the `http.response.plain` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response.plain",
      with: {
        body: "Hello, World",
      },
    },
  };
});
```

##### `http.response.json`

Return a JSON response with the `http.response.json` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response.json",
      with: {
        body: {
          hello: "world",
        },
      },
    },
  };
});
```

##### `http.response.html`

Return an HTML response with the `http.response.html` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response.html",
      with: {
        body: "<h1>Hello, World</h1>",
      },
    },
  };
});
```

##### `http.response`

Return a custom response with the `http.response` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response",
      with: {
        status: 302,
        headers: {
          Location: "/hello/world",
        },
      },
    },
  };
});
```
