import { ShapeX, type ShapeXInstance } from "shapex";
import Router, { type Route } from "./router.ts";
import http, { IncomingMessage, ServerResponse } from "node:http";

export type DeltoRoute = Route & {
  dispatch: string;
};

export type DeltoRequest = {
  url: URL;
  method: string;
};

export type DeltoResponse = {
  status?: number;
  body?: null | string | object | Buffer;
  headers?: {
    [key: string]: string;
  };
};

export type DeltoState = {
  http?: {
    request: DeltoRequest;
    response?: DeltoResponse;
  };
};

export type DeltoOpts = {
  port?: number;
};

/**
 * Rose instance with HTTP route methods and ShapeX instance methods.
 */
export type DeltoInstance<T extends DeltoState> = ShapeXInstance<T> & {
  serve: (opts?: DeltoOpts) => void;
  get: (path: string, dispatch: string) => void;
  post: (path: string, dispatch: string) => void;
  put: (path: string, dispatch: string) => void;
  delete: (path: string, dispatch: string) => void;
  patch: (path: string, dispatch: string) => void;
  options: (path: string, dispatch: string) => void;
  head: (path: string, dispatch: string) => void;
  trace: (path: string, dispatch: string) => void;
  connect: (path: string, dispatch: string) => void;
};

/**
 * Creates a Rose instance with the given runtime platform.
 */
export default function Delto<T extends DeltoState>(
  state: T,
): DeltoInstance<T> {
  const $ = ShapeX<T>(state);
  const routes = [] as DeltoRoute[];

  $.subscribe("$.http.request", (state) => {
    // No HTTP state, nothing to do
    if (!state.http) return;

    const route = Router.route(
      routes,
      state.http?.request.url.pathname,
      state.http?.request.method,
    );

    // No matching route found, set response to null
    if (!route) {
      return {
        state,
        http: {
          ...state.http,
          response: null,
        },
      };
    }

    // Route found, dispatch the route
    return {
      state,
      dispatch: {
        to: route.dispatch,
        with: Router.params(route, state.http?.request.url.pathname),
      },
    };
  });

  $.subscribe("set-http.request.body", (state, body?: Buffer) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          request: {
            ...state.http?.request,
            body,
          },
        },
      },
    };
  });

  $.subscribe("http.request", (state, req?: IncomingMessage) => {
    // No request, nothing to do
    if (!req) {
      return { state };
    }

    const bodyChunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      bodyChunks.push(chunk);
    });

    req.on("end", () => {
      $.dispatch("set-http.request.body", Buffer.concat(bodyChunks));
    });

    return {
      state: {
        ...state,
        http: {
          request: {
            ...req,
            url: new URL(req.url ?? "", `http://${req.headers.host}`),
          },
        },
      },
    };
  });

  $.subscribe("http.response.plain", (state, data?: DeltoResponse) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          response: {
            body: data?.body ?? "",
            status: data?.status ?? 200,
            headers: {
              "Content-Type": "text/plain",
            },
          },
        },
      },
    };
  });

  $.subscribe("http.response.json", (state, data?: DeltoResponse) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          response: {
            body: data?.body ? JSON.stringify(data.body) : "{}",
            status: data?.status ?? 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        },
      },
    };
  });

  // Create get routes
  const _get = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "GET",
      dispatch,
    });
  };

  const _post = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "POST",
      dispatch,
    });
  };

  const _put = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "PUT",
      dispatch,
    });
  };

  const _delete = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "DELETE",
      dispatch,
    });
  };

  const _patch = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "PATCH",
      dispatch,
    });
  };

  const _options = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "OPTIONS",
      dispatch,
    });
  };

  const _head = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "HEAD",
      dispatch,
    });
  };

  const _trace = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "TRACE",
      dispatch,
    });
  };

  const _connect = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "CONNECT",
      dispatch,
    });
  };

  // Start HTTP server
  const _serve = (opts?: DeltoOpts): void => {
    const server = http.createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        $.dispatch("http.request", req);

        const response = $.state().http?.response;

        // If a response is set, return it
        if (response) {
          res.writeHead(response.status ?? 200, response.headers);
          res.end(response.body);

          return;
        }

        // Otherwise, return a 404 response
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.end("Not found.");
      },
    );

    server.listen(opts?.port ?? 3000, () => {
      console.log(`Listening on http://0.0.0.0:${opts?.port ?? 3000}`);
    });
  };

  return {
    serve: _serve,
    get: _get,
    post: _post,
    put: _put,
    delete: _delete,
    patch: _patch,
    options: _options,
    head: _head,
    trace: _trace,
    connect: _connect,
    ...$,
  };
}
