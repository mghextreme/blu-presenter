import { describe, expect, it } from 'vite-plus/test';
import { secretQuery } from '../secret-query';

describe('secretQuery', () => {
  it('is empty without a secret', () => {
    expect(secretQuery(undefined)).toBe('');
    expect(secretQuery('')).toBe('');
  });

  it('encodes the secret', () => {
    expect(new URLSearchParams(secretQuery('a+b&c=d')).get('secret')).toBe('a+b&c=d');
  });
});
