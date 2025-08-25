# ---- Build Stage ----
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Install deps
    COPY package*.json ./
    RUN npm install
    
    # Copy source and build
    COPY . .
    RUN npm run build
    
    # ---- Runtime Stage ----
    FROM node:20-alpine
    WORKDIR /app
    
    # Install only production deps
    COPY package*.json ./
    RUN npm install --omit=dev
    
    # Copy compiled output from builder
    COPY --from=builder /app/dist ./dist
    
    # Runtime command: write CONFIG_YAML into a file, then run the watcher
    CMD sh -c "echo \"$CONFIG_YAML\" > /app/config.yaml && node dist/index.mjs"
    