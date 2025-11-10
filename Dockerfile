FROM node:20-slim

WORKDIR /app

# Copy package files from the API app
COPY apps/api/package.json apps/api/pnpm-lock.yaml apps/api/tsconfig.json ./

# Install pnpm and project dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy API source files
COPY apps/api/src ./src/

# Build and expose
RUN pnpm build

ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "start"]
