# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/services ./src/services
COPY --from=builder /app/firebase-applet-config.json ./

# Install tsx for running server.ts
RUN npm install -g tsx

EXPOSE 3000

CMD ["tsx", "server.ts"]
