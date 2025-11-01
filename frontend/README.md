
Sur la machine dev :
Clone la repo + edit code si besoin ensuite,
cd /home/lotfi/quiz-app-docker-deploy-gitVersion && docker build -f backend/Dockerfile -t callmevrm/quiz-backend:latest .
docker push callmevrm/quiz-backend:latest

cd /home/lotfi/quiz-app-docker-deploy-gitVersion && docker build -f frontend/Dockerfile -t callmevrm/quiz-frontend:latest .
docker push callmevrm/quiz-frontend:latest



Sur le serveur veto-prod :
# 1. Créer le réseau Docker si ce n'est pas déjà fait
docker network create quiz-network
# 2. Définir les variables d'environnement

export POSTGRES_USER=edulabs
export POSTGRES_PASSWORD=MotdepassePGbg2025
export POSTGRES_DB=edulabs_quiz
export BACKEND_PORT=3000
export ALLOWED_ORIGINS="https://pratique.edulabs.fr,http://pratique.edulabs.fr"
export FRONTEND_PORT=5173
export VITE_API_BASE=/api
export DOMAIN=pratique.edulabs.fr


# Créer le volume pour PostgreSQL si ce n'est pas déjà fait
docker volume create pgdata-quiz-app

docker run -d --name quiz-db --network quiz-network \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=${POSTGRES_DB} \
  -v pgdata-quiz-app:/var/lib/postgresql/data \
  --restart unless-stopped postgres:17


docker run -d --name quiz-backend --network quiz-network \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@quiz-db:5432/${POSTGRES_DB}" \
  -e PORT=${BACKEND_PORT} \
  -e CONTENT_DIR=/app/content \
  -e ALLOWED_ORIGINS="${ALLOWED_ORIGINS}" \
  -e RATE_LIMIT_MAX=120 \
  -e RATE_LIMIT_WINDOW_MS=60000 \
  --restart unless-stopped \
  -l 'traefik.enable=true' \
  -l "traefik.http.routers.api.rule=Host(\`${DOMAIN}\`) && PathPrefix(\`/api\`)" \
  -l 'traefik.http.routers.api.entrypoints=web' \
  -l 'traefik.http.services.api.loadbalancer.server.port=3000' \
  -l 'traefik.http.middlewares.api-stripprefix.stripprefix.prefixes=/api' \
  -l 'traefik.http.routers.api.middlewares=api-stripprefix' \
  callmevrm/quiz-backend:latest


docker run -d --name traefik --network quiz-network -p 80:80 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /home/vrm/traefik/traefik-conf/traefik.yml:/traefik.yml:ro \
  --restart unless-stopped \
  traefik:v3.1 --configFile=/traefik.yml

docker run -d --name quiz-frontend --network quiz-network \
  --restart unless-stopped \
  -l 'traefik.enable=true' \
  -l "traefik.http.routers.quiz.rule=Host(\"${DOMAIN}\")" \
  -l 'traefik.http.routers.quiz.entrypoints=web' \
  -l 'traefik.http.services.quiz.loadbalancer.server.port=5173' \
  callmevrm/quiz-frontend:latest




#Contenu de traefik.yml : 

entryPoints:
  web:
    address: ":80"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false

api:
  dashboard: true
  insecure: true
