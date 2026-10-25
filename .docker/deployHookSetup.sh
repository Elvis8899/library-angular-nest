#!/bin/sh
# Installs the deploy hook (.docker/deployHook.py) as a service, so CI's
# deploy job can start `make dockerDeploy` through https://<DOMAIN>/hooks/deploy.
# Generates .docker/.env's DEPLOY_TOKEN when it's missing. Safe to run again.
# Run from anywhere in the repo: sudo sh .docker/deployHookSetup.sh (or make serverHook)
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo sh $0" >&2
  exit 1
fi
cd "$(dirname "$0")/.."
repo=$(pwd)
# The user who owns the clone runs the deploys (its Git key, its sudo)
owner="${SUDO_USER:-$(stat -c %U .)}"

if [ ! -f .docker/.env ]; then
  echo "No .docker/.env: run make serverSetup first" >&2
  exit 1
fi
if ! grep -q '^DEPLOY_TOKEN=.' .docker/.env; then
  sed -i '/^DEPLOY_TOKEN=/d' .docker/.env
  printf '\n# The deploy hook'"'"'s token (make serverHook), also the GitHub secret DEPLOY_TOKEN\nDEPLOY_TOKEN=%s\n' "$(openssl rand -hex 32)" >> .docker/.env
  echo "Added DEPLOY_TOKEN to .docker/.env"
fi

cat > /etc/systemd/system/library-deploy-hook.service <<UNIT
[Unit]
Description=Library deploy hook (CI starts make dockerDeploy)
After=docker.service network-online.target
Wants=docker.service network-online.target

[Service]
User=$owner
WorkingDirectory=$repo
ExecStart=/usr/bin/python3 $repo/.docker/deployHook.py
# Its address is the Docker network's gateway, there only once Docker is up
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable library-deploy-hook
systemctl restart library-deploy-hook

# nginx reads its config (with the /hooks/ route) when it starts
if docker compose --file .docker/docker-compose.yml ps --quiet nginx | grep -q .; then
  docker compose --file .docker/docker-compose.yml restart nginx
fi

token=$(sed -n 's/^DEPLOY_TOKEN=//p' .docker/.env)
domain=$(sed -n 's/^DOMAIN=//p' .docker/.env)
cat <<DONE

Deploy hook running (systemctl status library-deploy-hook). In GitHub,
Settings → Secrets and variables → Actions:
  Secrets:   DEPLOY_TOKEN = $token
  Variables: DEPLOY_URL   = https://$domain
DONE
