import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { runSmartBuilderDemo } from './smartBuilder.js';

import fetchGMDetails from './fetchGMDetails.js';

const GMLink = 'https://maps.app.goo.gl/DentistDemoSF'; // Simulating user pasting a link

(async () => {
  try {
    const leadData = await fetchGMDetails(GMLink);
    const url = await runSmartBuilderDemo(leadData);
    console.log(`\n🎉 POC SUCCESS! View the smart-generated site here:\n👉 ${url}\n`);
  } catch (e) {
    console.error('Test Failed:', e);
  }
})();
