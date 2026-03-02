# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install Smithery CLI globally so workers can call smithery tools
RUN npm install -g @smithery/cli

# Copy production deps + compiled output
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Railway injects PORT at runtime; default to 3000 for local runs
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.js"]
