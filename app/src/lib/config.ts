const host = import.meta.env.VITE_API_HOST;
const port = parseInt(import.meta.env.VITE_API_PORT || '3000', 10);

export const api = {
  host,
  port,
  url: `http://${host}:${port}`,
}
