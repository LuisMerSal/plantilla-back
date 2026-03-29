# Local Dockerfile - Optimized for local Docker Compose usage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the pre-built application
COPY dist/ ./dist/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
