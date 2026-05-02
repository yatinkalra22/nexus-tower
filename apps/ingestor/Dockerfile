FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .

# We use tsx to run the typescript file directly in the container
# This is efficient for a hackathon background service.
CMD ["npx", "tsx", "apps/ingestor/index.ts"]
