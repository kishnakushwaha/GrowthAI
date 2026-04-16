# Lightweight image — just the backend API
FROM node:20-slim

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy the rest of the application
WORKDIR /app
COPY . .

# Final setup
WORKDIR /app/backend
EXPOSE 8080
CMD ["npm", "start"]
