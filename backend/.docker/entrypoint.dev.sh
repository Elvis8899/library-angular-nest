#!/bin/bash

cd /usr/src/app
if [ ! -f '.env.dev' ]; then
  cp .env.example .env.dev
fi

yarn
# Prisma 7 generates the client only when asked, not on install or migrate
yarn generate
yarn migrate:init
# Prisma 7 never seeds on migrate; the seed skips a database that has data
yarn seed
yarn start:dev
