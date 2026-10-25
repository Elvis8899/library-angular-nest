COMPOSE_PROD = sudo docker compose --file .docker/docker-compose.yml
# The production stack, (re)built from the checked-out code
PROD_UP = $(COMPOSE_PROD) up pgadmin postgres certbot prometheus grafana nginx --build -d --quiet-pull
# The commit dockerDeploy deploys; CI passes the one it tested
REF ?= origin/main

help:
	@echo 'Run "make <target>" where <target> is one of the following:'
	@echo '  serverSetup'
	@echo '  serverHook'
	@echo '  dockerDev'
	@echo '  dockerProd'
	@echo '  dockerMigrate'
	@echo '  dockerDeploy'
	@echo '  dockerCertificate'

# Prepares a fresh Ubuntu server: Docker, swap, network, .env files with secrets
serverSetup:
	sudo sh .docker/serverSetup.sh

# Installs the deploy hook CI calls (a service on the host; prints the GitHub
# secret and variable to set)
serverHook:
	sudo sh .docker/deployHookSetup.sh

dockerDev:
	docker compose --file .docker/docker-compose-dev.yml up --build -d --quiet-pull

dockerProd:
	git pull && $(PROD_UP)

# Applies the migrations and waits for them, failing if one does
dockerMigrate:
	$(COMPOSE_PROD) run --rm --build migrate-deploy

# The commit the last finished deploy went out with
DEPLOYED = .docker/.deployed

# Deploys REF: fast-forwards to it (never back), applies its migrations,
# rebuilds and restarts the stack, then removes the previous build's images so
# the disk doesn't fill up. CI's deploy job runs it on the server. Nothing
# happens when REF is the commit the last finished deploy recorded (a failed
# one records nothing, so it's tried again); FORCE=1 deploys anyway
dockerDeploy:
	git fetch origin
	@if [ -z "$(FORCE)" ] && [ "$$(git rev-parse '$(REF)^{commit}')" = "$$(cat $(DEPLOYED) 2>/dev/null)" ]; then \
		echo "Already deployed: $$(git log -1 --format='%h %s' '$(REF)')"; \
	else \
		set -e; \
		git merge --ff-only $(REF); \
		$(MAKE) dockerMigrate; \
		$(PROD_UP); \
		sudo docker image prune -f; \
		git rev-parse HEAD > $(DEPLOYED); \
	fi

# Issues the HTTPS certificate for DOMAIN (.docker/.env). Run it once, before
# the first dockerProd, or again after changing DOMAIN, with nginx stopped:
# certbot answers Let's Encrypt's challenge on port 80 itself
dockerCertificate:
	$(COMPOSE_PROD) run --rm --publish 80:80 --entrypoint /bin/sh certbot \
		-c 'certbot certonly --standalone --non-interactive --agree-tos --email "$$CERTBOT_EMAIL" --cert-name site --domain "$$DOMAIN"'
