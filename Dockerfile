FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/web/package*.json apps/web/
RUN npm ci && npm --prefix apps/api ci && npm --prefix apps/web ci

COPY . .
RUN npm run build:deploy

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm ci --omit=dev && npm --prefix apps/api ci --omit=dev

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/data apps/api/data
COPY --from=build /app/apps/web/dist apps/web/dist

EXPOSE 4000
CMD ["npm", "run", "start:deploy"]
