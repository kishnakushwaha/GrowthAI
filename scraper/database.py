import os
from datetime import datetime
from supabase import create_client

# Auto-load environment variables from backend/.env if running manually
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set!")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def init_db():
    print("Supabase connected.")

def calculate_lead_score(website, reviews, rating):
    """A9: Decomposed into sub-scores for explainability"""
    scores = {}
    
    # Sub-score: Website presence (0-30)
    if not website or website == 'N/A' or str(website).strip() == '':
        scores['score_website'] = 30  # High need = high score
    else:
        scores['score_website'] = 5
    
    # Sub-score: Reviews (0-25)
    reviews_val = 0
    try:
        reviews_val = int(str(reviews).replace(',', '').replace(' reviews', '').replace(' review', '').strip()) if reviews else 0
    except:
        pass
    if reviews_val <= 5:
        scores['score_reviews'] = 25
    elif reviews_val <= 15:
        scores['score_reviews'] = 15
    elif reviews_val <= 50:
        scores['score_reviews'] = 8
    else:
        scores['score_reviews'] = 2
        
    # Sub-score: Rating (0-25)
    try:
        rating_val = float(rating) if rating else 0
        if rating_val > 0 and rating_val < 3.5:
            scores['score_rating'] = 25
        elif rating_val < 4.0:
            scores['score_rating'] = 15
        elif rating_val < 4.5:
            scores['score_rating'] = 8
        else:
            scores['score_rating'] = 3
    except:
        scores['score_rating'] = 10

    # Sub-score: Online presence (0-20)
    # Placeholder — enriched later by website intelligence
    scores['score_presence'] = 10

    total = min(sum(scores.values()), 100)
    return total, scores

def save_lead(data, agency_id=None):
    place_name = data.get('place_name')
    phone = data.get('phone')
    maps_url = data.get('maps_url')
    
    # F4: Enhanced Deduplication — check maps_url (most reliable), then phone, then name
    if maps_url and maps_url != 'N/A':
        res_url = supabase.table('businesses').select('id').eq('maps_url', maps_url).execute()
        if res_url.data:
            print(f"  ⏭️ Skipped duplicate (maps_url match): {place_name}")
            return False

    if phone and phone != 'N/A':
        res_phone = supabase.table('businesses').select('id').eq('phone', phone).execute()
        if res_phone.data:
            print(f"  ⏭️ Skipped duplicate (phone match): {place_name}")
            return False
            
    res_name = supabase.table('businesses').select('id').eq('place_name', place_name).execute()
    if res_name.data:
        print(f"  ⏭️ Skipped duplicate (name match): {place_name}")
        return False

    # 2. Aggressive Scorer — A9: decomposed sub-scores
    lead_score, sub_scores = calculate_lead_score(data.get('website'), data.get('reviews'), data.get('rating'))
    
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
            'score_website': sub_scores.get('score_website', 0),
            'score_reviews': sub_scores.get('score_reviews', 0),
            'score_rating': sub_scores.get('score_rating', 0),
            'score_presence': sub_scores.get('score_presence', 0),
            'scraped_at': datetime.now().isoformat(),
            'rank_position': data.get('rank_position'),
            'search_query': data.get('search_query'),
            'search_city': data.get('search_city'),
            'agency_id': agency_id
        }).execute()
        if res.data and len(res.data) > 0:
            lead_id = res.data[0]['id']
            
            # AUTO-ENROLL: Automatically enroll this lead into the default outreach campaign
            try:
                # Find the first active campaign (the "General Outreach" campaign) for this agency
                campaigns = supabase.table('campaigns').select('id').eq('status', 'active').eq('agency_id', agency_id).limit(1).execute()
                if campaigns.data and len(campaigns.data) > 0:
                    campaign_id = campaigns.data[0]['id']
                    # Check if not already enrolled
                    existing = supabase.table('campaign_leads').select('id').eq('campaign_id', campaign_id).eq('lead_id', lead_id).execute()
                    if not existing.data:
                        supabase.table('campaign_leads').insert({
                            'campaign_id': campaign_id,
                            'lead_id': lead_id,
                            'status': 'active',
                            'current_step': 0,
                            'agency_id': agency_id
                        }).execute()
                        print(f"  🚀 Auto-enrolled {place_name} into campaign #{campaign_id}")
            except Exception as enroll_err:
                print(f"  ⚠️ Auto-enroll failed for {place_name}: {enroll_err}")
            
            return lead_id
        return True
    except Exception as e:
        print(f"Error saving lead {place_name}: {e}")
        return False

def export_to_csv(filename='leads_export.csv'):
    import pandas as pd
    result = supabase.table('businesses').select('*').execute()
    pd.DataFrame(result.data).to_csv(filename, index=False)
    print(f"Exported {len(result.data)} leads to {filename}")

def compute_competitor_benchmarks(search_query):
    """F5: Competitor benchmarking — compute avg stats for a search query"""
    try:
        result = supabase.table('businesses').select(
            'id, place_name, rating, reviews, rank_position, website'
        ).eq('search_query', search_query).execute()
        
        if not result.data or len(result.data) < 2:
            return
        
        leads = result.data
        ratings = [float(l['rating']) for l in leads if l.get('rating') and l['rating'] != 'N/A']
        reviews = [int(l['reviews']) for l in leads if l.get('reviews')]
        has_website = [l for l in leads if l.get('website') and l['website'] != 'N/A']
        
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0
        avg_reviews = round(sum(reviews) / len(reviews)) if reviews else 0
        website_pct = round(len(has_website) / len(leads) * 100) if leads else 0
        
        # Top 3 competitors (by reviews)
        sorted_leads = sorted(leads, key=lambda x: int(x.get('reviews', 0) or 0), reverse=True)
        top_3 = [l['place_name'] for l in sorted_leads[:3]]
        
        # Store benchmark per lead (update each business row)
        for lead in leads:
            lead_reviews = int(lead.get('reviews', 0) or 0)
            lead_rating = float(lead.get('rating', 0) or 0)
            
            benchmark = {
                'comp_avg_rating': avg_rating,
                'comp_avg_reviews': avg_reviews,
                'comp_website_pct': website_pct,
                'comp_top_3': ', '.join(top_3),
                'comp_review_gap': avg_reviews - lead_reviews,
                'comp_rating_gap': round(avg_rating - lead_rating, 2)
            }
            
            supabase.table('businesses').update(benchmark).eq('id', lead['id']).execute()
        
        print(f"  📊 F5: Competitor benchmarks computed for '{search_query}' — avg {avg_rating}⭐ / {avg_reviews} reviews / {website_pct}% have websites")
        
    except Exception as e:
        print(f"  ⚠️ Competitor benchmark failed: {e}")

if __name__ == '__main__':
    init_db()
