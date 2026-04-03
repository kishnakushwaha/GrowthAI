# Use the official Microsoft Playwright image which includes all browser system dependencies
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# 1. Install Python and other necessary tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 2. Set the working directory
WORKDIR /app

# 3. Copy the entire project (to have access to scraper/ from backend/)
# Since Render context is usually the repo root or the root directory,
# we need to be careful with paths. Assuming build context is repo root.
COPY . .

# 4. Install Backend (Node.js) dependencies
WORKDIR /app/backend
RUN npm install

# 5. Install Scraper (Python) dependencies
WORKDIR /app/scraper
# Ensure playwright python package is installed and use the pre-installed system browsers
RUN pip3 install --no-cache-dir -r requirements.txt
# No need to run 'playwright install' because the base image already has them

# 6. Final setup
WORKDIR /app/backend
EXPOSE 3001

# Start the Node.js server
CMD ["npm", "start"]
