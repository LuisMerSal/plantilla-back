# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-alpine AS builder

ENV TZ=America/Guayaquil
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copiar package files e instalar dependencias (incluye devDeps para build)
COPY package*.json ./
RUN npm ci

# Copiar solo lo necesario para compilar
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Generar Prisma Client
RUN npx prisma generate

# Compilar la aplicación NestJS
RUN npm run build

# Eliminar devDependencies después del build
RUN npm prune --production

# =============================================================================
# Stage 2: Production (imagen final liviana)
# =============================================================================
FROM node:20-alpine AS production

ENV TZ=America/Guayaquil
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Variables de entorno para producción
ENV NODE_ENV=production

# Cloud Run inyecta la variable PORT (default 8080)
EXPOSE 8080

# Iniciar la aplicación en modo producción
# nest build genera dist/src/main.js porque tsconfig incluye prisma/
CMD ["node", "dist/src/main.js"]
