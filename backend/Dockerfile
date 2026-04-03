# Use the official Microsoft Playwright image which includes all browser system dependencies
FROM mcr.microsoft.com/playwright:v1.58.0-jammy

# 1. Install Python and other necessary tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 2. Set the working directory
WORKDIR /app

# 3. Copy the entire project
COPY . .

# 4. Install Backend (Node.js) dependencies
WORKDIR /app/backend
RUN npm install

# 5. Install Scraper (Python) dependencies
WORKDIR /app/scraper
RUN pip3 install --no-cache-dir -r requirements.txt

# 6. Final setup
WORKDIR /app/backend

# Cloud Run uses $PORT env var (defaults to 8080), Render uses 3001
# Our server.js already reads process.env.PORT
EXPOSE 8080

# Start the Node.js server
CMD ["npm", "start"]
