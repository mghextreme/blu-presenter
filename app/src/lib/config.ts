/* eslint-disable @typescript-eslint/no-explicit-any */
interface IMetaEnv {
  env: any
}

const metaEnv = (import.meta as unknown as IMetaEnv).env

const protocol = metaEnv.VITE_API_PROTOCOL || 'http';
const host = metaEnv.VITE_API_HOST;
const port = parseInt(metaEnv.VITE_API_PORT || '0', 10);
const url = `${protocol}://${host}` + (port > 0 ? `:{port}` : '');

export const api = {
  host,
  port,
  url,
}
