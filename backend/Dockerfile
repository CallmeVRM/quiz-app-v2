FROM node:20-slim

# Install production dependencies
WORKDIR /app

# Copy package files first for better caching
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production && \
    npm install tsx

# Copy source code and content
COPY backend/src ./src
COPY backend/content ./content

# Create uploads directory
RUN mkdir -p /app/uploads

# Set default environment variables
ENV PORT=3000 \
    CONTENT_DIR=/app/content \
    RATE_LIMIT_MAX=120 \
    RATE_LIMIT_WINDOW_MS=60000

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/themes', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run with tsx (TypeScript execution)
CMD ["npx", "tsx", "src/server.ts"]
