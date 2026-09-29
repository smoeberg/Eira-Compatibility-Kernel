FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/observability packages/observability
COPY packages/bff-core packages/bff-core
COPY packages/service-auth packages/service-auth
COPY packages/fingerprint packages/fingerprint
COPY apps/api apps/api
RUN pnpm install --filter @eck/api...
RUN pnpm --filter @eck/observability build && pnpm --filter @eck/bff-core build && pnpm --filter @eck/service-auth build && pnpm --filter @eck/fingerprint build && pnpm --filter @eck/api build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Preserve pnpm's workspace symlinks and package-local node_modules.
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
