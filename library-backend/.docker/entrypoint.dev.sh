#!/bin/bash

cd /usr/src/app
if [ ! -f '.env.dev' ]; then
  cp .env.example .env.dev
fi

yarn
yarn migrate:init
# Prisma only seeds when migrate creates or resets the database; this fills
# an existing empty one too, and skips a database that has data
yarn seed
yarn start:dev
