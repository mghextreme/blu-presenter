FROM node:24-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY src ./src
COPY *.json ./
COPY *.yaml ./
COPY *.js ./

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["node", "dist/main"]
