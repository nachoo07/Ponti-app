FROM node:20.19.0-alpine AS ui-builder
WORKDIR /app/ui

COPY ui/package.json ui/package-lock.json ./
RUN npm ci

COPY ui/ ./
RUN npm run build

FROM node:20.19.0-alpine AS api-builder
WORKDIR /app/api

COPY api/package.json api/package-lock.json ./
RUN npm ci

COPY api/ ./
RUN npm run build

FROM node:20.19.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=api-builder /app/api/dist ./dist
COPY --from=api-builder /app/api/node_modules ./node_modules
COPY --from=ui-builder /app/ui/dist ./dist/public

EXPOSE 8080

CMD ["node", "dist/index.js"]
