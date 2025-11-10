FROM node:20-slim

WORKDIR /app

# Copy package files from the API app and workspace lockfile
COPY apps/api/package.json apps/api/tsconfig.json ./
COPY pnpm-lock.yaml ./

# Copy Prisma schema so `prisma generate` (postinstall) can run during install
COPY apps/api/prisma ./prisma

# Install pnpm and project dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy API source files
COPY apps/api/src ./src/
COPY apps/api/src/scripts ./src/scripts
COPY apps/api/prisma ./prisma

# Build and expose
RUN pnpm build

ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "start"]
