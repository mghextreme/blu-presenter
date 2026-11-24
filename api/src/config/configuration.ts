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
    // falls back to the Spotify client secret (server-only, mandatory for
    // the flow anyway). Set a dedicated key for strict key separation.
    stateSecret:
      process.env.SPOTIFY_STATE_SECRET || process.env.SPOTIFY_CLIENT_SECRET,
  },
  youtube: {
    // A Google OAuth client with the YouTube Data API v3 enabled.
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    // See spotify.stateSecret.
    stateSecret:
      process.env.YOUTUBE_STATE_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
  },
  apiDocs: {
    enabled: process.env.ENABLE_API_DOCS === 'true',
  },
});
