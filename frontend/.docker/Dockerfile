# Production image for the web app: nginx serving the Angular build, and
# proxying the API (its config is mounted from the root .docker/nginx.conf).
# Build context: the repository root.

ARG NODE_IMAGE=node:24-slim

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
# The workspace's manifests with only the web app and the contracts in it
COPY package.json yarn.lock .docker/pruneWorkspace.js ./
COPY frontend/package.json frontend/
COPY packages/contracts/package.json packages/contracts/
# --ignore-scripts skips the Prettier postinstall, which needs the sources
RUN node pruneWorkspace.js frontend \
  && yarn install --frozen-lockfile --ignore-scripts
COPY packages/contracts packages/contracts
COPY frontend frontend
RUN yarn workspace @library/contracts build
WORKDIR /app/frontend
# Node sizes its heap from the machine's memory, without the swap: on a 2 GB
# server the build runs out of it, so it may grow into the swap
RUN NODE_OPTIONS=--max-old-space-size=2048 yarn build

FROM nginx:latest
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html
