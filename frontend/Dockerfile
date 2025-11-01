FROM node:20-slim

WORKDIR /app

# Copy package files for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY eslint.config.js ./

# Build argument for API base URL
ARG VITE_API_BASE=http://localhost:3000
ENV VITE_API_BASE=${VITE_API_BASE}

# Build the app
RUN npm run build

# Install serve globally for serving static files
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use serve to host the built files (no CORS issues)
CMD ["serve", "-s", "dist", "-l", "5173"]
