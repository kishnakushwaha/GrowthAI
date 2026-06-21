/**
 * Test: Smart Builder Agent with a mock Gym/Fitness Lead.
 * Usage: node testBuilderGym.js
 */
import 'dotenv/config';
import { buildAndDeployAgentSite } from './engines/builderAgentEngine.js';

const mockGymLead = {
  place_name: "Apex Fitness Club",
  business_name: "Apex Fitness Club (एपेक्स फिटनेस क्लब)",
  industry: "Fitness Center / GYM",
  category: "Gym & Strength Training",
  city: "Noida",
  phone: "+91 99999 88888",
  email: "info@apexfitness.in",
  address: "Plot No 4, Sector 62, Noida, Uttar Pradesh 201301, India",
  rating: 4.9,
  user_ratings_total: 88,
  reviews: [
    { author: "Amit Verma", text: "Best gym in Noida Sector 62! Extremely premium equipment and certified trainers. Coach Karan Singh is excellent!", company: "Google Review" },
    { author: "Sophia Sen", text: "Super spacious, very clean, and the community vibe is awesome. Love the HIIT and yoga classes here!", company: "Google Review" }
  ],
  photos: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80"
  ]
};

async function main() {
  console.log('\n=== 🏋️ Testing Builder Agent with Gym Lead ===\n');
  console.log(`Lead Name: ${mockGymLead.place_name}`);
  console.log(`Industry: ${mockGymLead.industry}`);
  console.log(`City: ${mockGymLead.city}`);
  
  const startTime = Date.now();
  try {
    const url = await buildAndDeployAgentSite(mockGymLead);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCESS in ${elapsed}s!`);
    console.log(`Preview URL: ${url}\n`);
  } catch (err) {
    console.error('\n❌ Builder failed:', err.message);
    console.error(err.stack);
  }
}

main();
