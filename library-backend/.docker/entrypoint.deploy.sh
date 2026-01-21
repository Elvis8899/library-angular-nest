#!/bin/bash

cd /home/node/app

yarn migrate:deploy

yarn postMigration
