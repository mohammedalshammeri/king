import { afterEach, vi } from 'vitest';

vi.stubGlobal('__DEV__', true);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal('__DEV__', true);
});