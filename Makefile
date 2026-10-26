# Images build in a builder of their own (dockerBuilder), with a low CPU weight
BUILDER = library-builder
# The frontend's image, which CI builds and pushes for every commit to main
# (the frontend-image job): the stack runs the checked-out commit's, read when
# each command runs (dockerDeploy fast-forwards first)
FRONTEND_IMAGE = ghcr.io/elvis8899/library-angular-nest/frontend
COMPOSE_PROD = sudo env BUILDX_BUILDER=$(BUILDER) FRONTEND_IMAGE=$(FRONTEND_IMAGE) FRONTEND_TAG=$$(git rev-parse HEAD) docker compose --file .docker/docker-compose.yml
# Pulls the checked-out commit's frontend image; fails when CI hasn't pushed
# it (or, the package made private, the server's GHCR login is gone), before
# anything restarts
PROD_PULL = $(COMPOSE_PROD) pull --quiet nginx
# The production stack, (re)built from the checked-out code (the frontend
# pulled); pgAdmin only on demand (pgadminUp)
PROD_UP = $(COMPOSE_PROD) up postgres certbot prometheus grafana nginx --build -d --quiet-pull
# The commit dockerDeploy deploys; CI passes the one it tested
REF ?= origin/main
COMPOSE_DEV = docker compose --file .docker/docker-compose-dev.yml

help:
	@echo 'Run "make <target>" where <target> is one of the following:'
	@echo '  serverSetup'
	@echo '  serverHook'
	@echo '  dockerDev'
	@echo '  dockerDevRefresh'
	@echo '  dockerProd'
	@echo '  dockerMigrate'
	@echo '  dockerDeploy'
	@echo '  dockerCertificate'
	@echo '  dockerBuilder'
	@echo '  pgadminUp'
	@echo '  pgadminDown'

# Prepares a fresh Ubuntu server: Docker, swap, network, .env files with secrets
serverSetup:
	sudo sh .docker/serverSetup.sh

# Installs the deploy hook CI calls (a service on the host; prints the GitHub
# secret and variable to set)
serverHook:
	sudo sh .docker/deployHookSetup.sh

dockerDev:
	$(COMPOSE_DEV) up --build -d --quiet-pull

# Brings the running dev stack up to the checked-out code after a pull, a
# dependency, contracts or schema change: installs the workspace (which
# rebuilds the contracts), drops Vite's pre-bundled copy of them, and restarts
# the API (generate, migrate, seed) and the Angular dev server
dockerDevRefresh:
	$(COMPOSE_DEV) run --rm install
	rm -rf frontend/.angular/cache
	$(COMPOSE_DEV) restart app frontend

dockerProd: dockerBuilder
	git pull && $(PROD_PULL) && $(PROD_UP)

# The builder the production images build in, made once: a BuildKit container
# with an eighth of a container's CPU weight (128 to the default 1024), so a
# build takes the CPU nobody else wants and yields it to the API, Postgres and
# nginx as soon as they need it. Its cache is its own (pruned after a deploy)
dockerBuilder:
	@sudo docker buildx inspect $(BUILDER) >/dev/null 2>&1 || \
		sudo docker buildx create --name $(BUILDER) --driver docker-container --driver-opt cpu-shares=128

# Applies the migrations and waits for them, failing if one does
dockerMigrate: dockerBuilder
	$(COMPOSE_PROD) run --rm --build migrate-deploy

# The commit the last finished deploy went out with
DEPLOYED = .docker/.deployed

# Deploys REF: fast-forwards to it (never back), applies its migrations, pulls
# its frontend image (stopping there when it can't), rebuilds and restarts the
# stack, then removes the previous build's images (the older frontend ones too) and
# the build cache no build used for a week (never what this one used), so the
# disk doesn't fill up, empties Docker's default builder's cache (the builds
# used it before; nothing should now) and stops the builder, which holds memory
# between deploys (the next build starts it, its cache kept). CI's deploy job
# runs it on the server. Nothing happens when REF is the commit the last
# finished deploy recorded (a failed one records nothing, so it's tried again);
# FORCE=1 deploys anyway
dockerDeploy:
	git fetch origin
	@if [ -z "$(FORCE)" ] && [ "$$(git rev-parse '$(REF)^{commit}')" = "$$(cat $(DEPLOYED) 2>/dev/null)" ]; then \
		echo "Already deployed: $$(git log -1 --format='%h %s' '$(REF)')"; \
	else \
		set -e; \
		git merge --ff-only $(REF); \
		$(MAKE) dockerMigrate; \
		$(PROD_PULL); \
		$(PROD_UP); \
		sudo docker image prune -f; \
		sudo docker images $(FRONTEND_IMAGE) --format '{{.Repository}}:{{.Tag}}' \
			| grep -v ":$$(git rev-parse HEAD)$$" | xargs -r sudo docker rmi; \
		sudo docker buildx prune --builder $(BUILDER) --force --filter until=168h; \
		sudo docker builder prune --builder default --all --force; \
		sudo docker buildx stop $(BUILDER); \
		git rev-parse HEAD > $(DEPLOYED); \
	fi

# pgAdmin (https://<DOMAIN>/pgadmin4/) only while it's needed: deploys don't
# start it, and stopped it frees its memory and its login page; its settings
# and saved servers stay in the container
pgadminUp:
	$(COMPOSE_PROD) up -d pgadmin

pgadminDown:
	$(COMPOSE_PROD) stop pgadmin

# Issues the HTTPS certificate for DOMAIN (.docker/.env). Run it once, before
# the first dockerProd, or again after changing DOMAIN, with nginx stopped:
# certbot answers Let's Encrypt's challenge on port 80 itself
dockerCertificate:
	$(COMPOSE_PROD) run --rm --publish 80:80 --entrypoint /bin/sh certbot \
		-c 'certbot certonly --standalone --non-interactive --agree-tos --email "$$CERTBOT_EMAIL" --cert-name site --domain "$$DOMAIN"'
