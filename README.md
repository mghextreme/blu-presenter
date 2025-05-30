# BluPresenter

## Supabase

Check [Supabase documentation](https://supabase.com/docs).

### Development

```sh
supabase start
```

The application seeding will add one user:

- Email: `admin@example.com`
- Password: `password`

### Docker

> This is an alternative to the development command

```sh
cd docker
docker compose up
# Or the following to include some development helpers
# docker compose up -f ./dev/docker-compose.dev.yml up
```

## App

Built around [react-router-dom](https://reactrouter.com/).

```sh
cd app
```

### Install

```sh
pnpm install
```

### Develop

```sh
pnpm dev
```

### Build

```sh
pnpm build
```

## API

Built around [NestJS](https://nestjs.com/).

```sh
cd api
```

### Install

```sh
pnpm install
```

### Develop

```sh
pnpm start:dev
```

### Build

```sh
pnpm build
```
