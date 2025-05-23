/* eslint-disable @typescript-eslint/no-explicit-any */
interface IMetaEnv {
  env: any
}

const metaEnv = (import.meta as unknown as IMetaEnv).env

const host = metaEnv.VITE_API_HOST;
const port = parseInt(metaEnv.VITE_API_PORT || '3000', 10);

export const api = {
  host,
  port,
  url: `http://${host}:${port}`,
}

const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
const supabaseKey = metaEnv.VITE_SUPABASE_KEY;

export const supabase = {
  url: supabaseUrl,
  key: supabaseKey,
}
