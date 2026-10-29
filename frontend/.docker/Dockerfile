# Production image for the web app: nginx serving the Angular build, and
# proxying the API (its config is mounted from the root .docker/nginx.conf).
# Build context: the repository root. CI builds it and pushes it to GHCR (the
# frontend-image job); the server only pulls it.

FROM node:26-slim AS builder
WORKDIR /app
# The workspace's manifests with only the web app and the contracts in it
COPY package.json yarn.lock .docker/pruneWorkspace.js ./
COPY frontend/package.json frontend/
COPY packages/contracts/package.json packages/contracts/
# --ignore-scripts skips the root's postinstall, which builds the contracts
# before their sources are copied. A slow registry can wait past yarn's 30 s timeout: allow 10 minutes
RUN node pruneWorkspace.js frontend \
  && yarn install --frozen-lockfile --ignore-scripts --network-timeout 600000
COPY packages/contracts packages/contracts
COPY frontend frontend
RUN yarn workspace @library/contracts build
WORKDIR /app/frontend
# No type or template checks: CI's `yarn build` runs them beside it, and a
# commit that fails them is never deployed
RUN yarn build:unchecked

FROM nginx:1.31.0
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html
