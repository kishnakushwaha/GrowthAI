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

def is_hot(website, reviews):
    if not website or website == 'N/A' or website.strip() == '':
        return True
    try:
        rev_count = int(str(reviews).replace(',', '').replace(' reviews', '').replace(' review', '').strip()) if reviews else 0
        if rev_count < 15:
            return True
    except:
        pass
    return False

def save_lead(data):
    place_name = data.get('place_name')
    result = supabase.table('businesses').select('id').eq('place_name', place_name).execute()
    if result.data:
        return False

    hot_lead = is_hot(data.get('website'), data.get('reviews'))
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
        supabase.table('businesses').insert({
            'place_name': place_name,
            'industry': data.get('industry'),
            'rating': rating_val,
            'reviews': reviews_val,
            'phone': data.get('phone'),
            'website': data.get('website'),
            'address': data.get('address'),
            'maps_url': data.get('maps_url'),
            'is_hot_lead': hot_lead,
            'scraped_at': datetime.now().isoformat()
        }).execute()
    except Exception as e:
        print(f"Error saving lead {place_name}: {e}")
        return False
    return True

def export_to_csv(filename='leads_export.csv'):
    import pandas as pd
    result = supabase.table('businesses').select('*').execute()
    pd.DataFrame(result.data).to_csv(filename, index=False)
    print(f"Exported {len(result.data)} leads to {filename}")

if __name__ == '__main__':
    init_db()
