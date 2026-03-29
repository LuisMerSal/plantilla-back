# Base image
FROM node:20.11.0-alpine

ENV TZ=America/Guayaquil
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code and config files
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy environment file
RUN rm -f .env
COPY ./environments/prod/.env .env

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# For production, remove dev dependencies ONLY after successful build
RUN npm prune --production

EXPOSE 50068

# Start the application - main.js is in dist/src/ not dist/
CMD ["node", "dist/src/main.js"]