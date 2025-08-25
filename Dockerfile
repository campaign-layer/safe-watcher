# Stage 1: Builder (full Node.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production (distroless)
FROM gcr.io/distroless/nodejs22-debian12

USER 1000:1000
WORKDIR /app

ENV NODE_ENV=production
ARG PACKAGE_VERSION
LABEL org.opencontainers.image.version="${PACKAGE_VERSION}"

# Copy compiled output and config
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/config.yaml /app/config.yaml

# Start the app
CMD ["/app/dist/index.mjs"]
