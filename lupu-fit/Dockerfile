# UNTESTED draft: build not run in the authoring environment.
FROM node:22-slim AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build:hosted
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/client/dist TRUST_PROXY=1
COPY --from=build /app /app
EXPOSE 8080
WORKDIR /app/server
CMD ["npx", "tsx", "src/index.ts"]
