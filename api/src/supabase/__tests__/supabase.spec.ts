import { ConfigService } from '@nestjs/config';
import { Supabase } from '../supabase';

describe('Supabase', () => {
  const config = (values: Record<string, string | undefined>) =>
    new ConfigService(values);

  it('has a client as soon as it is constructed', () => {
    const supabase = new Supabase(
      config({ 'supabase.url': 'http://supabase.local', 'supabase.key': 'k' }),
    );

    expect(supabase.getClient().auth).toBeDefined();
  });

  it('fails fast without a Supabase URL', () => {
    expect(() => new Supabase(config({ 'supabase.key': 'k' }))).toThrow();
  });
});
