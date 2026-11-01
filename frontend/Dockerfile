FROM node:20-alpine

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./
RUN npm install

# Copy application blocks
COPY . .

EXPOSE 5173

# Run Vite in host-network mode to expose ports cleanly
CMD ["npm", "run", "dev", "--", "--host"]
