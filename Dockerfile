# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy config file
COPY config.yaml ./config.yaml

# Copy package.json (needed for npm install --omit=dev)
COPY package*.json ./

# Skip Husky hooks for production install
ENV HUSKY_SKIP_INSTALL=1

# Install only production dependencies
RUN npm install --omit=dev

# Set NODE_ENV
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist/index.mjs"]
