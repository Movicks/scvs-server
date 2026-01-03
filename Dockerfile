# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /src

# Copy package files
COPY package*.json ./

# Install all dependencies (dev + prod) for build
RUN npm ci

# Copy all source files
COPY . .

# Exclude Prisma seeds from main build
RUN npm run build

# Generate Prisma client (Prisma supports ESM via prisma.config.mjs)
RUN npx prisma generate

# -------- Runtime stage --------
FROM node:20-alpine

WORKDIR /src

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy build output
COPY --from=builder /src/dist ./dist

# Copy Prisma client generated files
COPY --from=builder /src/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema for runtime if needed
COPY --from=builder /src/prisma ./prisma

# Expose app port
EXPOSE 9000

# Start the app
CMD ["node", "dist/main.js"]
    