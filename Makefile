.PHONY: up down logs ps

COMPOSE = docker compose -f docker-compose.yml -p mobile

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps
