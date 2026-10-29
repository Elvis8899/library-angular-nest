# Production image for the API. Build context: the repository root.
# Targets: `migrate` applies migrations and exits; the default (last) stage runs the API.

# Shared base: Prisma's engines need OpenSSL at build time and at runtime
FROM node:26-slim AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl dumb-init \
  && rm -rf /var/lib/apt/lists/*
# Node 26's images come without Yarn (or Corepack): install the root
# package.json's packageManager version
RUN npm install -g yarn@1.22.22
WORKDIR /app

# The workspace's manifests with only the API and the contracts in it
FROM base AS manifests
COPY package.json yarn.lock .docker/pruneWorkspace.js ./
COPY backend/package.json backend/
COPY packages/contracts/package.json packages/contracts/
RUN node pruneWorkspace.js backend && rm pruneWorkspace.js

# Build the contracts, generate the Prisma client into prisma/generated, then
# compile it with the app into backend/dist/ with SWC, which skips the type
# check: CI's typecheck has run before any deploy, and tsc's build needed
# more memory than the server could spare from the running stack
FROM manifests AS builder
# The build runs at a low CPU weight (make dockerBuilder), so on a busy server a
# download can wait well past yarn's 30 s timeout: allow 10 minutes
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY packages/contracts packages/contracts
COPY backend backend
RUN yarn workspace @library/contracts build
WORKDIR /app/backend
RUN npx prisma generate && yarn build:unchecked

# One-shot migration runner (docker-compose service `migrate-deploy`)
FROM builder AS migrate
ENTRYPOINT ["yarn", "migrate:deploy"]

# Runtime dependencies only, plus the Prisma CLI
FROM manifests AS prod-deps
RUN yarn install --frozen-lockfile --production=true --network-timeout 600000 \
  && yarn cache clean
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

FROM base AS runtime
ARG VERSION=1.0.0
ENV NODE_ENV=production \
    TZ=America/Sao_Paulo \
    VERSION=${VERSION}
# The manifests and node_modules (node_modules/@library/contracts links to
# packages/contracts), then what was built
COPY --chown=node:node --from=prod-deps /app ./
COPY --chown=node:node --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --chown=node:node --from=builder /app/backend/dist ./backend/dist
COPY --chown=node:node backend/prisma ./backend/prisma
WORKDIR /app/backend
# No .env in the image: Compose passes the settings in when the container
# starts (env_file in .docker/docker-compose.yml), so the secrets stay out of
# the image and any registry it's pushed to
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
