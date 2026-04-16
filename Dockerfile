# Use the official Microsoft Playwright image
FROM mcr.microsoft.com/playwright:v1.58.0-jammy

# 1. Install Python & dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 2. Set the working directory
WORKDIR /app

# 3. Copy everything (Root Context)
# This includes backend/, scraper/, and package.json
COPY . .

# 4. Install Backend Dependencies
WORKDIR /app/backend
RUN npm install

# 5. Install Scraper Dependencies
WORKDIR /app/scraper
RUN pip3 install --no-cache-dir -r requirements.txt || echo "Requirements not found, skipping"

# 6. Final setup
WORKDIR /app/backend

# Cloud Run uses $PORT (defaults to 8080)
EXPOSE 8080

# Use the absolute path to start
CMD ["node", "server.js"]
