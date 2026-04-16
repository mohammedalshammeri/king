import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestUse = vi.fn();
const responseUse = vi.fn();
const createMock = vi.fn(() => ({
  interceptors: {
    request: { use: requestUse },
    response: { use: responseUse },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: createMock,
  },
  create: createMock,
}));

vi.mock('./token', () => ({
  getAccessToken: vi.fn(() => 'token-123'),
  clearAccessToken: vi.fn(),
}));

describe('api client', () => {
  beforeEach(() => {
    createMock.mockClear();
    requestUse.mockClear();
    responseUse.mockClear();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses the configured API base URL when provided', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com/api/v1');

    await import('./api');

    expect(createMock).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com/api/v1',
      timeout: 20000,
    });
  });

  it('falls back to localhost when the env var is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');

    await import('./api');

    expect(createMock).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000/api/v1',
      timeout: 20000,
    });
  });

  it('registers request and response interceptors', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com/api/v1');

    await import('./api');

    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);
  });
});