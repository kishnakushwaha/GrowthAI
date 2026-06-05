import os
import re
from supabase import create_client

# Load environment
env_path = '../backend/.env'
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_query():
    phone = "+91 98975 90901"
    cleaned_phone = "919897590901"
    
    # Let's test the or_conditions string
    or_conditions = f"phone.eq.{phone},phone.eq.{cleaned_phone}"
    print("or_conditions:", or_conditions)
    try:
        res = supabase.table('businesses').select('id').or_(or_conditions).execute()
        print("Success! Data count:", len(res.data))
    except Exception as e:
        print("Error with raw space:", e)

    # Let's test with double quotes around the phone value if it has spaces/special chars
    # PostgREST style: quote the value
    or_conditions_quoted = f'phone.eq."{phone}",phone.eq.{cleaned_phone}'
    print("or_conditions_quoted:", or_conditions_quoted)
    try:
        res = supabase.table('businesses').select('id').or_(or_conditions_quoted).execute()
        print("Quoted Success! Data count:", len(res.data))
    except Exception as e:
        print("Quoted Error:", e)

if __name__ == '__main__':
    test_query()
