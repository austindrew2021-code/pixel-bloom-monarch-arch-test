type Chain = {
  middleware: (..._args: unknown[]) => Chain;
  validator: (..._args: unknown[]) => Chain;
  handler: (fn?: (...args: unknown[]) => unknown) => (...args: unknown[]) => Promise<unknown>;
};

function chain(): Chain {
  const api: Chain = {
    middleware: () => api,
    validator: () => api,
    handler: () => async () => null,
  };
  return api;
}

export function createServerFn(_opts?: unknown): Chain {
  return chain();
}

export function createMiddleware() {
  return chain();
}

export function createFileRoute(_path?: string) {
  return (opts: { component?: unknown } = {}) => opts;
}

export function getRequest(): unknown {
  return undefined;
}

export function getCookie(_name?: string): unknown {
  return undefined;
}
