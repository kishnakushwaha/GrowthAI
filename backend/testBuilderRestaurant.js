/**
 * Test: Smart Builder Agent with a mock Restaurant/Food Lead.
 * Usage: node testBuilderRestaurant.js
 */
import 'dotenv/config';
import { buildAndDeployAgentSite } from './engines/builderAgentEngine.js';

const mockRestaurantLead = {
  place_name: "Truffle & Vine Bistro",
  business_name: "Truffle & Vine Bistro (ट्रफल एंड वाइन बिस्ट्रो)",
  industry: "Bistro & Fine Dining",
  category: "Italian & French Restaurant",
  city: "New Delhi",
  phone: "+91 98111 22222",
  email: "hello@truffleandvine.in",
  address: "Shop 12, Khan Market, New Delhi, Delhi 110003, India",
  rating: 4.8,
  user_ratings_total: 152,
  reviews: [
    { author: "Rahul Dev", text: "Amazing food! Chef Marco Rossi's hand-made truffle pasta is to die for. Warm, candle-lit cozy ambience and excellent service.", company: "Google Review" },
    { author: "Anjali Gupta", text: "Perfect place for a quiet dinner. The wine list selection is top-notch and every dish is beautifully presented.", company: "Google Review" }
  ],
  photos: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80"
  ]
};

async function main() {
  console.log('\n=== 🍷 Testing Builder Agent with Restaurant Lead ===\n');
  console.log(`Lead Name: ${mockRestaurantLead.place_name}`);
  console.log(`Industry: ${mockRestaurantLead.industry}`);
  console.log(`City: ${mockRestaurantLead.city}`);
  
  const startTime = Date.now();
  try {
    const url = await buildAndDeployAgentSite(mockRestaurantLead);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCESS in ${elapsed}s!`);
    console.log(`Preview URL: ${url}\n`);
  } catch (err) {
    console.error('\n❌ Builder failed:', err.message);
    console.error(err.stack);
  }
}

main();
