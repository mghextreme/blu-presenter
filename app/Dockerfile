# syntax=docker/dockerfile:1.7
#
# Build context: repo root (the pnpm workspace).
# Build: docker build -f app/Dockerfile .
#
# Uses the workspace pnpm-lock.yaml as the single source of truth.

FROM node:24-slim AS builder

ARG NODE_ENV
ARG VITE_API_HOST
ARG VITE_API_PORT

ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_HOST=${VITE_API_HOST}
ENV VITE_API_PORT=${VITE_API_PORT}

RUN npm install -g pnpm

WORKDIR /workspace

# Copy workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY app/package.json ./app/

# Install all workspace deps (frozen lockfile enforced by pnpm in CI).
RUN pnpm install --frozen-lockfile

# Copy app source and build.
COPY app ./app
RUN pnpm --filter blu-presenter-app build

FROM nginx:alpine

WORKDIR /app

COPY --from=builder /workspace/app/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
