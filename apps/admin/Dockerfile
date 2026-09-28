FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/admin apps/admin
RUN pnpm install --filter @eck/admin...
ARG VITE_ECK_AUTH_MODE=proxy
ENV VITE_ECK_AUTH_MODE=$VITE_ECK_AUTH_MODE
RUN pnpm --filter @eck/admin build

FROM nginx:alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
