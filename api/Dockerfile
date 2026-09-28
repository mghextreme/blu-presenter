# syntax=docker/dockerfile:1.7
#
# Build context: repo root (the pnpm workspace).
# Build: docker build -f api/Dockerfile .
#
# Uses the workspace pnpm-lock.yaml as the single source of truth, then
# `pnpm deploy` produces a self-contained dir with prod deps for runtime.

FROM node:24-slim AS builder

RUN npm install -g pnpm@11.28.1

WORKDIR /workspace

# Copy workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY app/package.json ./app/

# Install all workspace deps (frozen lockfile required in CI by default).
# The pnpm content-addressable store is cached across builds via a BuildKit
# cache mount. --store-dir must point INTO the mount: without an explicit
# store dir, pnpm relocates the store next to the project when hard links
# fail across the mount boundary, which would defeat the cache.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# Copy api source and build.
COPY api ./api
RUN pnpm --filter blu-presenter-api build

# Produce a self-contained, prod-only deploy bundle for the api package.
# --legacy: required since pnpm v10 unless inject-workspace-packages=true.
# `pnpm deploy` does not include build artifacts (dist is gitignored and
# not in `files`), so copy dist explicitly into the deploy bundle.
# Same cache mount so the deploy's pruned install reuses the warm store.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm deploy --legacy --filter=blu-presenter-api --prod /deploy --store-dir=/pnpm/store && \
    cp -r api/dist /deploy/dist

FROM node:24-slim

WORKDIR /app

COPY --from=builder /deploy/dist ./dist
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main"]
