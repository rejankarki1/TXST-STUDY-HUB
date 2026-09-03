# ---------------------------------------------------------------- build stage
FROM node:22-slim AS build

WORKDIR /app

# openssl is required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
# The Prisma client is generated into src/, so it must exist before tsc runs.
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ----------------------------------------------------------- runtime stage
FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Prisma is a runtime dependency because CMD uses its CLI to deploy migrations
# before the API starts. `npx` must never need a network download at boot.
RUN npm ci --omit=dev

# prisma/ and prisma.config.ts ship so `migrate deploy` can run at boot.
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 5050

# Migrations run before the server accepts traffic, so a deploy can never serve
# a build against a schema it does not expect.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
