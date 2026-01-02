# -------- Build stage --------
    FROM node:20-alpine AS builder

    WORKDIR /src
    
    # Copy package files
    COPY package*.json ./
    
    # Install all dependencies (dev + prod) for build
    RUN npm ci
    
    # Copy all source files
    COPY . .
    
    # Generate Prisma client
    RUN npx prisma generate
    
    # Build NestJS app
    RUN npm run build
    
    # -------- Runtime stage --------
    FROM node:20-alpine
    
    WORKDIR /src
    
    # Copy package.json
    COPY package*.json ./
    
    # Install only production deps
    RUN npm ci --only=production
    
    # Copy build output
    COPY --from=builder /src/dist ./dist
    
    # Copy Prisma client from builder
    COPY --from=builder /src/node_modules/.prisma ./node_modules/.prisma
    
    # Copy prisma schema if needed at runtime
    COPY --from=builder /src/prisma ./prisma
    
    # Expose port
    EXPOSE 3000
    
    # Start the app
    CMD ["node", "dist/main.js"]
    