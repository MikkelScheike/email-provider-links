const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

export function mockConsole() {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();
}

export function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

export function getConsoleMocks() {
  return {
    log: console.log as ReturnType<typeof vi.fn>,
    warn: console.warn as ReturnType<typeof vi.fn>,
    error: console.error as ReturnType<typeof vi.fn>,
    info: console.info as ReturnType<typeof vi.fn>,
    debug: console.debug as ReturnType<typeof vi.fn>
  };
}
