FROM node:20-slim AS build
WORKDIR /var/app
COPY ../package.json ../yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ../prisma ./prisma
RUN npx prisma generate
COPY .. .
RUN yarn build

FROM build AS migrate
RUN apt-get update -y && apt-get install -y openssl
ENTRYPOINT [ "sh", "/var/app/.docker/entrypoint.deploy.sh"]


FROM node:20-slim AS dependencies
WORKDIR /var/app
COPY package.json yarn.lock ./
RUN yarn install --production=true --frozen-lockfile
COPY --from=build /var/app/node_modules/.prisma /var/app/node_modules/.prisma
COPY --from=build /var/app/node_modules/prisma /var/app/node_modules/prisma


FROM node:20-slim AS runtime
WORKDIR /home/node/app/
ARG VERSION="1.0.0"
ENV VERSION $VERSION
ENV NODE_ENV production
ENV TZ America/Sao_Paulo
COPY --chown=node:node --from=build /var/app/dist /home/node/app/dist/
COPY --chown=node:node --from=dependencies /var/app/node_modules /home/node/app/node_modules/

RUN apt-get update -y && apt-get install -y openssl dumb-init

USER node

EXPOSE 3000

COPY ../.env /home/node/app/.env
COPY ../.docker/entrypoint.sh ./entrypoint.sh
COPY ../prisma /home/node/app/prisma
COPY ../package.json /home/node/app/package.json

ENTRYPOINT [ "sh", "/home/node/app/entrypoint.sh" ]
