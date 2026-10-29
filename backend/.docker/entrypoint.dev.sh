#!/bin/bash

cd /usr/src/app/backend
if [ ! -f '.env.dev' ]; then
  cp .env.example .env.dev
fi

# The compose file's install service has installed the workspace
# Prisma 7 generates the client only when asked, not on install or migrate
yarn generate
# Applies the migrations; new ones are made on the host (yarn migrate)
yarn migrate:deploy
# Prisma 7 never seeds on migrate; the seed skips a database that has data
yarn seed
yarn start:dev
