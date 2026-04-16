#!/bin/bash

# GrowthAI Deployment Helper
# This script reads your local backend/.env and deploys to Cloud Run.

echo "🚀 Preparing GrowthAI Deployment..."

# 1. Load env vars from backend/.env into a comma-separated list
# We use sed to handle potential spaces and ensure a clean CSV format
ENV_VARS=$(cat backend/.env | xargs | sed 's/ /,/g')

if [ -z "$ENV_VARS" ]; then
    echo "❌ Error: backend/.env is empty or missing!"
    exit 1
fi

echo "📦 Uploading sources and building container..."

# 2. Execute gcloud deploy from root
# We include --clear-base-image to handle the switch from Buildpacks to Dockerfile
gcloud run deploy growthai-backend \
  --source . \
  --region asia-south1 \
  --clear-base-image \
  --set-env-vars "$ENV_VARS"

echo "✅ Deployment Process Complete!"
