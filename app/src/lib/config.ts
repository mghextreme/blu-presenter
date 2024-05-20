const host = import.meta.env.VITE_API_HOST;
const port = parseInt(import.meta.env.VITE_API_PORT || '3000', 10);

export const api = {
  host,
  port,
  url: `http://${host}:${port}`,
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = {
  url: supabaseUrl,
  key: supabaseKey,
}
