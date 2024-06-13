# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy only package.json, pnpm-workspace.yaml, and pnpm-lock.yaml to install dependencies first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json tsconfig.json ./

# Install pnpm globally
RUN npm install -g pnpm@8.9.0

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN pnpm install

# Build the project
RUN pnpm build

# Expose port 4444
EXPOSE 4444
EXPOSE 4445

ENV PORT 4444

# Command to run the application
CMD ["node", "packages/__e2e__/dist/index.js"]
