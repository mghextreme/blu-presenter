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

## License

This project is licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).

Copyright (C) 2025 Matias G. Henschel

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

For questions or issues, please visit: https://github.com/mghextreme/blu-presenter/issues
