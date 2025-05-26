FROM node:24-slim AS builder

ARG NODE_ENV
ARG VITE_API_HOST
ARG VITE_API_PORT

RUN npm install -g pnpm

WORKDIR /app

COPY src ./src
COPY public ./public
COPY *.json ./
COPY *.yaml ./
COPY *.js ./
COPY *.ts ./
COPY *.toml ./
COPY *.html ./
COPY *.cjs ./

ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_HOST=${VITE_API_HOST}
ENV VITE_API_PORT=${VITE_API_PORT}

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:alpine

WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
