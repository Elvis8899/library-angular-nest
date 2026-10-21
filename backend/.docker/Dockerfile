# Production image for the API. Build context: backend/
# Targets: `migrate` applies migrations and exits; the default (last) stage runs the API.

ARG NODE_IMAGE=node:24-slim

# Shared base: Prisma's engines need OpenSSL at build time and at runtime
FROM ${NODE_IMAGE} AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl dumb-init \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Generate the Prisma client into prisma/generated, then compile it with the app into dist/
FROM base AS builder
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN npx prisma generate && yarn build

# One-shot migration runner (docker-compose service `migrate-deploy`)
FROM builder AS migrate
ENTRYPOINT ["yarn", "migrate:deploy"]

# Runtime dependencies only, plus the Prisma CLI
FROM base AS prod-deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

FROM base AS runtime
ARG VERSION=1.0.0
ENV NODE_ENV=production \
    TZ=America/Sao_Paulo \
    VERSION=${VERSION}
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma ./prisma
# No .env in the image: Compose passes the settings in when the container
# starts (env_file in .docker/docker-compose.yml), so the secrets stay out of
# the image and any registry it's pushed to
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
