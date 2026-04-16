import { describe, expect, it } from 'vitest';
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './token';

describe('token helpers', () => {
  it('stores and reads access token from localStorage', () => {
    setAccessToken('access-123');

    expect(getAccessToken()).toBe('access-123');
  });

  it('stores and reads refresh token from localStorage', () => {
    setRefreshToken('refresh-123');

    expect(getRefreshToken()).toBe('refresh-123');
  });

  it('clears tokens from localStorage and cookie', () => {
    setAccessToken('access-123');
    setRefreshToken('refresh-123');

    clearAccessToken();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(document.cookie).not.toContain('kom_token=access-123');
  });
});