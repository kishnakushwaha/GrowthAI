/**
 * Test: Bypasses Supabase and runs the Smart Builder Agent with a mock lead.
 * Usage: GEMINI_MODEL=gemini-1.5-flash node testBuilderMock.js
 */
import 'dotenv/config';
import { buildAndDeployAgentSite } from './engines/builderAgentEngine.js';

const mockLead = {
  place_name: "Dental Planet",
  business_name: "Dental Planet (डेंटल प्लैनेट)",
  industry: "Dental Clinic",
  category: "Cosmetic & General Dentistry",
  city: "Greater Noida",
  phone: "+91 78273 99394",
  email: "info@dentalplanet.in",
  address: "Eros Sampoornam, West, Sector 2, Patwari, Greater Noida, Uttar Pradesh 201318, India",
  rating: 5.0,
  user_ratings_total: 43,
  reviews: [
    { author: "Amit Kumar", text: "Dr. Shivangi Attri is the best dentist in Greater Noida. The clinic has very premium modern equipment and the treatment was completely pain-free!", company: "Google Review" },
    { author: "Preeti Singh", text: "Very professional doctor and staff. Extremely clean clinic at Eros Sampoornam. Highly recommended for any dental issues.", company: "Google Review" }
  ],
  photos: [
    "https://lh5.googleusercontent.com/p/AF1QipM5x26_abcd=w100-h100-k-no",
    "https://lh5.googleusercontent.com/p/AF1QipObcd_efgh=w150-h150-k-no"
  ]
};

async function main() {
  console.log('\n=== 🎯 Testing Builder Agent with Mock Lead ===\n');
  console.log(`Lead Name: ${mockLead.place_name}`);
  console.log(`Industry: ${mockLead.industry}`);
  console.log(`City: ${mockLead.city}`);
  
  const startTime = Date.now();
  try {
    const url = await buildAndDeployAgentSite(mockLead);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCESS in ${elapsed}s!`);
    console.log(`Preview URL: ${url}\n`);
  } catch (err) {
    console.error('\n❌ Builder failed:', err.message);
    console.error(err.stack);
  }
}

main();
