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
# --ignore-scripts skips the Prettier postinstall, which needs the sources. The
# build runs at a low CPU weight (make dockerBuilder), so on a busy server a
# download can wait well past yarn's 30 s timeout: allow 10 minutes
RUN node pruneWorkspace.js frontend \
  && yarn install --frozen-lockfile --ignore-scripts --network-timeout 600000
COPY packages/contracts packages/contracts
COPY frontend frontend
RUN yarn workspace @library/contracts build
WORKDIR /app/frontend
# Light enough to build beside the running stack on a 2 GB server: no type or
# template checks (CI's `yarn build` has run them before any deploy), one
# worker thread, and a 1 GB heap per thread, since Node collects garbage
# lazily under a higher limit (the build needs about 768 MB)
RUN NODE_OPTIONS=--max-old-space-size=1024 NG_BUILD_MAX_WORKERS=1 yarn build:unchecked

FROM nginx:latest
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html
