#!/bin/bash

# Create the VM instance
gcloud compute instances create whatsapp-engine-node \
    --project=alpine-beacon-487715-k3 \
    --zone=asia-south1-a \
    --machine-type=e2-micro \
    --tags=wa-engine \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --metadata=startup-script="#!/bin/bash
exec > /var/log/startup-script.log 2>&1
apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git chromium libgbm-dev
mkdir -p /opt/app
cd /opt/app
git clone https://github.com/kishnakushwaha/GrowthAI.git
# IMPORTANT: Set these variables before running or pass them as --metadata during VM creation
# Replace placeholders with your actual Supabase credentials
cat <<EOT >> .env
SUPABASE_URL=\${SUPABASE_URL:-"your-supabase-url"}
SUPABASE_KEY=\${SUPABASE_KEY:-"your-supabase-key"}
PORT=80
EOT
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
npm install
npm install -g pm2
pm2 start server.js --name WA --env PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true --env PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
pm2 save
env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root"
