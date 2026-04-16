import { afterEach } from 'vitest';

afterEach(() => {
  localStorage.clear();
  document.cookie = 'kom_token=; path=/; max-age=0';
});