export default () => ({
  port: parseInt(process.env.API_PORT, 10) || 3000,
  database: {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  auth: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
  app: {
    baseUrl: process.env.APP_BASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY,
  },
  captcha: {
    enabled: process.env.DISABLE_CAPTCHA !== 'true',
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    // HMAC key protecting the OAuth `state` parameter of the connect flow;
    // falls back to the Supabase JWT secret when not set.
    stateSecret:
      process.env.SPOTIFY_STATE_SECRET || process.env.SUPABASE_JWT_SECRET,
  },
  apiDocs: {
    enabled: process.env.ENABLE_API_DOCS === 'true',
  },
});
