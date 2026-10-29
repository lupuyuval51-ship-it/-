# LUPU-FIT production image: one container serves the web app and the API (plus the phone-reminder job).
#
#   docker build -t lupu-fit .
#   docker run -p 3000:3000 -e DATABASE_URL=postgres://... -e SESSION_SECRET=<32+ random chars> \
#     -e DB_AUTO_MIGRATE=true -e APP_URL=https://your-domain lupu-fit
#
# Render builds this file from the Blueprint at the repository root (../render.yaml); see docs/deploy.md.
# The image holds no secrets: everything is configured through environment variables at run time.
# If Docker Hub rate-limits the pull, use its mirror:
#   --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22.23.4-bookworm-slim
ARG NODE_IMAGE=node:22.23.4-bookworm-slim

# ---- build: install everything, build client + server, then drop dev dependencies -------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.base.json ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY scripts ./scripts
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# ---- runtime: only what `node dist/server/index.js` reads ---------------------------------------------
# dist/server (API bundle, db-cli.js, SQL migrations in dist/server/db/migrations; the built-in exercise,
# food and meal data are bundled into index.js), dist/client (the web app), production node_modules and
# package.json ("type": "module").
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Files stay owned by root (read-only for the app); the server writes nothing to disk.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/server/index.js"]
