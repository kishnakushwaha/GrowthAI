import asyncio
from database import supabase

def calculate_historical_score(lead):
    score = 10
    
    website = lead.get('website', '')
    if not website or website == 'N/A' or str(website).strip() == '':
        score += 25
        
    rating_val = str(lead.get('rating', '0'))
    try:
        r_val = float(rating_val) if rating_val != 'N/A' else 0.0
        if r_val > 0 and r_val < 3.5:
            score += 20
    except:
        pass
        
    reviews_val = str(lead.get('reviews', '0'))
    try:
        rev_val = int(reviews_val) if reviews_val != 'N/A' else 0
        if rev_val > 0 and rev_val < 15:
            score += 15
    except:
        pass
        
    is_hot = score >= 60
    return score, is_hot

def backfill():
    print("Fetching all historical leads...")
    res = supabase.table('businesses').select('*').execute()
    leads = res.data
    print(f"Found {len(leads)} leads to update.")
    
    updated = 0
    for lead in leads:
        # Calculate new 100-point score based on the raw metrics already saved
        new_score, is_hot = calculate_historical_score(lead)
        
        # Only update if they don't have a score, or to correct it
        supabase.table('businesses').update({
            'lead_score': new_score, 
            'is_hot_lead': is_hot
        }).eq('id', lead['id']).execute()
        
        updated += 1
        if updated % 50 == 0:
            print(f"Updated {updated}/{len(leads)}...")
            
    print("✅ Backfill Complete! All leads now have their new scores.")

if __name__ == "__main__":
    backfill()
