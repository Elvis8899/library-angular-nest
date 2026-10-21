# Production image for the web app: nginx serving the Angular build, and
# proxying the API (its config is mounted from the root .docker/nginx.conf).
# Build context: frontend/

ARG NODE_IMAGE=node:24-slim

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package.json yarn.lock ./
# --ignore-scripts skips the Husky hook and the Prettier postinstall, which
# need the Git repository and the sources
RUN yarn install --frozen-lockfile --ignore-scripts
COPY . .
RUN yarn build

FROM nginx:latest
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
