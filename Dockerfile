# -------- Build stage --------
    FROM node:20-alpine AS builder

    WORKDIR /src
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    RUN npm run build
    
    # -------- Runtime stage --------
    FROM node:20-alpine
    
    WORKDIR /src
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    COPY --from=builder /src/dist ./dist
    
    CMD ["node", "dist/main.js"]
    