FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Copy Prisma schema so prisma generate can run
COPY prisma ./prisma

# Install pnpm and project dependencies
RUN npm install -g pnpm
RUN pnpm install

# Generate Prisma client (ensure prisma schema is present)
RUN pnpm prisma generate || true

# Copy source code
COPY src/ ./src/

# Build the application
RUN pnpm build

ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "start"]