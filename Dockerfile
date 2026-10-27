# RapidRoute Tactical Emergency Routing Engine
# Node.js 22 LTS Production Multi-Stage Container

# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code and build frontend bundle
COPY . .
RUN npm run build

# Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime tools
RUN apk add --no-cache curl tzdata

# Create dedicated non-privileged user for security compliance
RUN addgroup -S rapidroute && adduser -S rapidroute -G rapidroute

# Copy built artifacts and dependencies
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

COPY --chown=rapidroute:rapidroute . .
COPY --from=builder --chown=rapidroute:rapidroute /app/dist ./dist

USER rapidroute

EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

CMD ["node", "server.js"]
