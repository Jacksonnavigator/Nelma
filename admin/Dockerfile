# Admin dashboard (TanStack Start), built as a plain Node server.
#
# VITE_* values are baked into the browser bundle at build time, so pass them as build args.
# They are public settings, never secrets.

FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ARG VITE_DATA_MODE=api
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_DATA_MODE=${VITE_DATA_MODE} \
    NITRO_PRESET=node-server
RUN test -n "$VITE_API_URL" || (echo "Build arg VITE_API_URL is required" >&2; exit 1)
RUN bun run build


FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Nitro bundles the server and its dependencies into .output.
COPY --from=build --chown=node:node /app/.output ./.output
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
