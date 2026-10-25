#!/bin/bash

cd /usr/src/app/backend
if [ ! -f '.env.dev' ]; then
  cp .env.example .env.dev
fi

# The whole workspace, which also builds the contracts; the frontend
# container installs it too, so the mutex makes one wait
yarn install --frozen-lockfile --mutex file:/usr/src/app/.yarn-mutex
# Prisma 7 generates the client only when asked, not on install or migrate
yarn generate
yarn migrate:init
# Prisma 7 never seeds on migrate; the seed skips a database that has data
yarn seed
yarn start:dev
