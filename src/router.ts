/**
 * This module contains the Rose Router.
 *
 * @module
 */
export type Route = {
  path: string;
  method: string;
};

const route = <T extends Route>(
  routes: T[],
  path: string,
  method: string,
): T | null => {
  const parts = path.split("/");

  return (
    routes.find((route) => {
      const _parts = route.path.split("/");

      if (_parts.length !== parts.length) return false;

      for (let i = 0; i < _parts.length; i++) {
        if (_parts[i] !== parts[i] && !_parts[i].startsWith(":")) {
          return false;
        }

        if (route.method !== method) {
          return false;
        }
      }

      return true;
    }) ?? null
  );
};

export type RouteParams<
  S extends Record<string, unknown> = Record<string, unknown>,
> = {
  [K in keyof S]: S[K];
};

const params = <
  T extends Route,
  S extends Record<string, unknown> = Record<string, unknown>,
>(
  route: T,
  path: string,
): RouteParams<S> => {
  const parts = path.split("/");
  const _parts = route.path.split("/");
  const params = {} as RouteParams<S>;

  for (let i = 0; i < _parts.length; i++) {
    if (_parts[i].startsWith(":")) {
      params[_parts[i].slice(1) as keyof S] = parts[i] as S[keyof S];
    }
  }

  return params;
};

export default {
  route,
  params,
};
