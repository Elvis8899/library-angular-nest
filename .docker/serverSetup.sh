#!/bin/sh
# Prepares a fresh Ubuntu server (such as an AWS Lightsail instance) for the
# production stack: Docker, swap, the nginx network and the .env files with
# generated secrets. Safe to run again: each step skips what's already done.
# Run from anywhere in the repo: sudo sh .docker/serverSetup.sh (or make serverSetup)
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo sh $0" >&2
  exit 1
fi
cd "$(dirname "$0")/.."

# Docker Engine and the Compose plugin, from Docker's apt repository
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker"
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

# Building the images needs about 2 GB of memory: give small instances swap
memory_mb=$(awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo)
if [ "$memory_mb" -lt 3000 ] && [ -z "$(swapon --show)" ]; then
  echo "Adding 2 GB of swap (${memory_mb} MB of memory)"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# nginx reaches the other services through this network's gateway
if ! docker network inspect nginx_network >/dev/null 2>&1; then
  docker network create --subnet 172.18.0.0/16 --gateway 172.18.0.1 nginx_network
fi

# The settings files, with generated passwords and secrets. Owned by the user
# who ran sudo, so they can edit them
owner="${SUDO_USER:-root}"
if [ ! -f .docker/.env ]; then
  sed -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 32)|" \
    -e "s|^PGADMIN_PASSWORD=.*|PGADMIN_PASSWORD=$(openssl rand -hex 16)|" \
    -e "s|^DEPLOY_TOKEN=.*|DEPLOY_TOKEN=$(openssl rand -hex 32)|" \
    .docker/.env.example > .docker/.env
  chmod 600 .docker/.env
  chown "$owner" .docker/.env
  echo "Created .docker/.env"
fi
# The API's settings, in the repo root (outside the image's build context)
if [ ! -f .env ]; then
  sed -e "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY='$(openssl rand -hex 48)'|" \
    -e "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET='$(openssl rand -hex 48)'|" \
    -e "s|^LOG_PRETTIFY=.*|LOG_PRETTIFY='false'|" \
    backend/.env.example > .env
  chmod 600 .env
  chown "$owner" .env
  echo "Created .env"
fi

cat <<'DONE'

Server ready. Next:
  1. Set DOMAIN, CERTBOT_EMAIL and PGADMIN_EMAIL in .docker/.env
     (pgAdmin's generated password is there too)
  2. Point the domain's DNS at this server, and open ports 80 and 443
     (Lightsail: the instance's Networking tab)
  3. make dockerCertificate && make dockerMigrate && make dockerProd
DONE
