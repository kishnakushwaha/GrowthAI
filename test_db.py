from scraper.database import save_lead
print(save_lead({
    "place_name": "Test Dentist",
    "industry": "dentist",
    "rating": "4.5",
    "reviews": "10",
    "phone": "N/A",
    "website": "N/A",
    "address": "N/A",
    "maps_url": "N/A"
}))
