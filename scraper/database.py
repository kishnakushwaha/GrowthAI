import os
from datetime import datetime
from supabase import create_client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set!")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def init_db():
    print("Supabase connected.")

def calculate_lead_score(website, reviews, rating):
    score = 0
    # Missing Website Penalty (+25)
    if not website or website == 'N/A' or website.strip() == '':
        score += 25
    
    # Low Reviews Penalty (+15)
    reviews_val = 0
    try:
        reviews_val = int(str(reviews).replace(',', '').replace(' reviews', '').replace(' review', '').strip()) if reviews else 0
    except:
        pass
    if reviews_val <= 5:
        score += 15
        
    # Bad Rating Penalty (+20)
    try:
        rating_val = float(rating) if rating else 0
        if rating_val > 0 and rating_val < 3.5:
            score += 20
    except:
        pass

    return min(score, 100)

def save_lead(data):
    place_name = data.get('place_name')
    phone = data.get('phone')
    
    # 1. Smart Deduplication by Phone OR Name
    # We use multiple checks to prevent exact matches.
    if phone and phone != 'N/A':
        res_phone = supabase.table('businesses').select('id').eq('phone', phone).execute()
        if res_phone.data:
            return False
            
    res_name = supabase.table('businesses').select('id').eq('place_name', place_name).execute()
    if res_name.data:
        return False

    # 2. Aggressive Scorer
    lead_score = calculate_lead_score(data.get('website'), data.get('reviews'), data.get('rating'))
    
    # Legacy field fallback
    hot_lead = False if lead_score < 25 else True

    reviews_val = 0
    try:
        reviews_val = int(str(data.get('reviews', 0)).replace(',', '').replace(' reviews', '').replace(' review', '').strip())
    except:
        pass
    rating_val = None
    try:
        rating_val = float(data.get('rating'))
    except:
        pass

    try:
        res = supabase.table('businesses').insert({
            'place_name': place_name,
            'industry': data.get('industry'),
            'rating': rating_val,
            'reviews': reviews_val,
            'phone': data.get('phone'),
            'website': data.get('website'),
            'address': data.get('address'),
            'maps_url': data.get('maps_url'),
            'is_hot_lead': hot_lead,
            'lead_score': lead_score,
            'scraped_at': datetime.now().isoformat()
        }).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]['id']
        return True
    except Exception as e:
        print(f"Error saving lead {place_name}: {e}")
        return False

def export_to_csv(filename='leads_export.csv'):
    import pandas as pd
    result = supabase.table('businesses').select('*').execute()
    pd.DataFrame(result.data).to_csv(filename, index=False)
    print(f"Exported {len(result.data)} leads to {filename}")

if __name__ == '__main__':
    init_db()
