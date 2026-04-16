#!/bin/bash

# GrowthAI Deployment Helper
# This script reads your local backend/.env and deploys to Cloud Run.

echo "🚀 Preparing GrowthAI Deployment..."

# 1. Load env vars from backend/.env into a comma-separated list
ENV_VARS=$(cat backend/.env | xargs | sed 's/ /,/g')

if [ -z "$ENV_VARS" ]; then
    echo "❌ Error: backend/.env is empty or missing!"
    exit 1
fi

echo "📦 Uploading sources and building container..."

# 2. Deploy using --source (builds + deploys in one step)
gcloud run deploy growthai-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "$ENV_VARS"

echo "✅ Deployment Process Complete!"
