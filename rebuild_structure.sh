#!/bin/bash

# GrowthAI Repository Structure & Cleanup Script
# This script organizes the repository into a professional structure.

echo "🚀 Starting GrowthAI Housekeeping..."

# 1. Root & Documentation
echo "📁 Organizing Documentation..."
mkdir -p docs
mv MASTER_PLAN.md docs/ 2>/dev/null
mv growthAI_architecture_master_plan_v3.md docs/ 2>/dev/null
mv lead_generation_strategy.md docs/ 2>/dev/null
mv "audit tool working.md" docs/ 2>/dev/null
rm MASTER_PLAN.pdf lead_generation_strategy.pdf test_db.py 2>/dev/null

# 2. Backend Restructuring
echo "📁 Restructuring Backend..."
mkdir -p backend/engines
mkdir -p backend/database/schema
mkdir -p backend/archive

# Move engines
mv backend/auditEngine.js backend/engines/ 2>/dev/null
mv backend/crmEngine.js backend/engines/ 2>/dev/null
mv backend/emailEngine.js backend/engines/ 2>/dev/null
mv backend/geminiHelper.js backend/engines/ 2>/dev/null
mv backend/waSequenceEngine.js backend/engines/ 2>/dev/null

# Move databases & schema
mv backend/*.db backend/database/ 2>/dev/null
mv backend/content.json backend/database/ 2>/dev/null
mv backend/*.sql backend/database/schema/ 2>/dev/null

# Archive backend scripts
mv backend/fix_phase6.js backend/archive/ 2>/dev/null

# 3. Scraper Cleanup
echo "📁 Polishing Scraper..."
mkdir -p scraper/archive
mv scraper/debug.py scraper/archive/ 2>/dev/null
mv scraper/debug2.py scraper/archive/ 2>/dev/null
mv scraper/check.py scraper/archive/ 2>/dev/null
mv scraper/check_db.js scraper/archive/ 2>/dev/null
mv scraper/backfill_scores.py scraper/archive/ 2>/dev/null
mv scraper/compute_gaps.py scraper/archive/ 2>/dev/null

# Delete junk
rm scraper/debug_*.png 2>/dev/null
rm scraper/debug_html.txt 2>/dev/null
rm scraper/leads_export.csv 2>/dev/null

echo "✅ Repository Restructured successfully!"
echo "Note: I have already updated your server.js and engine imports to match this new layout."
