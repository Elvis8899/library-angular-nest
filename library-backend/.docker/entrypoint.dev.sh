#!/bin/bash

yarn config set cache-folder /usr/src/app/.docker/.yarn-cache --global

cd /usr/src/app
if [ ! -f '.env.dev' ]; then
  cp .env.example .env.dev
fi

yarn
yarn migrate:init
yarn start:dev
