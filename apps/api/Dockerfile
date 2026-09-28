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
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/observability/dist ./node_modules/@eck/observability/dist
COPY --from=build /app/packages/observability/package.json ./node_modules/@eck/observability/
COPY --from=build /app/packages/service-auth/dist ./node_modules/@eck/service-auth/dist
COPY --from=build /app/packages/service-auth/package.json ./node_modules/@eck/service-auth/
COPY --from=build /app/packages/bff-core/dist ./node_modules/@eck/bff-core/dist
COPY --from=build /app/packages/bff-core/package.json ./node_modules/@eck/bff-core/
COPY --from=build /app/packages/fingerprint/dist ./node_modules/@eck/fingerprint/dist
COPY --from=build /app/packages/fingerprint/package.json ./node_modules/@eck/fingerprint/
EXPOSE 3000
CMD ["node", "dist/main.js"]
