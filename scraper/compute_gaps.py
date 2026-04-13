import os
from supabase import create_client
from datetime import datetime

env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_KEY'))

def compute_competitor_gaps(search_query, search_city):
    print(f"📊 Computing Competitor Gaps for '{search_query}' in '{search_city}'...")
    
    # Target leads that belong to this exact cohort
    cohort = supabase.table('businesses').select('id, rank_position, reviews, rating').eq('search_query', search_query).eq('search_city', search_city).execute()
    
    if not cohort.data or len(cohort.data) == 0:
        print("No leads in cohort.")
        return

    # Find the top 3 ranking businesses in this cohort
    top_3 = sorted([b for b in cohort.data if b.get('rank_position')], key=lambda x: x['rank_position'])[:3]
    if len(top_3) == 0:
        print("No ranked competitors found.")
        return

    avg_reviews = sum([b.get('reviews', 0) or 0 for b in top_3]) / len(top_3)
    avg_rating = sum([b.get('rating', 0) or 0 for b in top_3]) / len(top_3)

    # Now calculate and insert loop holes for EVERY business in cohort
    for b in cohort.data:
        b_reviews = b.get('reviews', 0) or 0
        b_rating = b.get('rating', 0) or 0
        
        review_gap = avg_reviews - b_reviews
        rating_gap = avg_rating - b_rating
        
        # Upsert competitor gap
        supabase.table('competitor_gaps').upsert({
            'business_id': b['id'],
            'search_query': search_query,
            'search_city': search_city,
            'avg_competitor_reviews': avg_reviews,
            'avg_competitor_rating': avg_rating,
            'review_gap': review_gap,
            'rating_gap': rating_gap,
            'computed_at': datetime.now().isoformat()
        }, on_conflict='business_id, search_query, search_city').execute()
        
    print(f"✅ Gap analysis complete. Top 3 Average Reviews: {avg_reviews:.1f}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 3:
        compute_competitor_gaps(sys.argv[1], sys.argv[2])
