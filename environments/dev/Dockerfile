# Base image
FROM node:20.11.0-alpine as base

ENV TZ=America/Guayaquil
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Borrar la carpeta existente
RUN rm -rf .env

# Copiar el archivo de la ubicación local a la imagen Docker
COPY ./environment/dev/.env .

# Generate Prisma client
RUN npx prisma generate

# Add node_modules/.bin to PATH
ENV PATH /app/node_modules/.bin:$PATH

# En produccion
RUN npm run build

# Expose port
EXPOSE 40028

# Start the application
# CMD ["npm", "start"]
CMD ["npm", "run", "start:prod"]
