FROM node:22-alpine

# Install OpenSSL required by Prisma Engine on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Copy backend application source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 5000 5555

CMD ["node", "docker-entrypoint.cjs"]
