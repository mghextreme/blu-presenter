import { describe, expect, it } from 'vite-plus/test';
import { invitationQuery } from '../invitation-link';

describe('invitationQuery', () => {
  it('encodes secrets that contain URL syntax', () => {
    const query = invitationQuery({ id: 7, secret: 'ab+c/d=' });

    expect(new URLSearchParams(query).get('secret')).toBe('ab+c/d=');
    expect(new URLSearchParams(query).get('id')).toBe('7');
  });
});
