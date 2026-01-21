#!/bin/bash

cd /home/node/app

dumb-init node dist/src/main.js
