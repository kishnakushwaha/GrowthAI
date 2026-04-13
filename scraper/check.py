import os
import sys
from database import supabase

def test():
    print("Testing website_enrichment rows for new scrape...")
    # Fetch businesses
    res = supabase.table('businesses').select('id, place_name, phone, website').eq('industry', 'dentist in lucknow').execute()
    leads = res.data or []
    print(f"Found {len(leads)} dentists in lucknow.")
    
    if not leads:
        print("No leads found for that scrape!")
        return

    lead_ids = [l['id'] for l in leads]
    # Check enrichment
    rich = supabase.table('website_enrichment').select('*').in_('lead_id', lead_ids).execute()
    
    print(f"Found {len(rich.data)} website_enrichment rows.")
    
    if rich.data:
        for r in rich.data:
            print(f"Lead ID {r['lead_id']}: opp_type = {r.get('opportunity_type')}, speed = {r.get('pagespeed_mobile')}")
    else:
        print("CRITICAL: No enrichment data exists for these leads! Deep scraper completely skipped them or crashed.")

if __name__ == "__main__":
    test()
