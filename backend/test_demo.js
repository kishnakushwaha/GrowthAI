import { buildAndDeployDemo } from './engines/vercelDeployEngine.js';

async function generateDemo() {
  console.log('Generating Demo Website...');
  const mockLead = {
    business_name: 'Elite Plumbing Services',
    industry: 'Plumbing',
    city: 'Mumbai',
    phone: '+91 98765 43210',
    email: 'hello@eliteplumbing.in',
    notes: 'Premium residential and commercial plumbing services in Mumbai.'
  };

  try {
    const url = await buildAndDeployDemo(mockLead, 'demo1');
    console.log('\n✅ Demo successfully built!');
    console.log(`Local Preview URL: ${url}`);
  } catch (err) {
    console.error('Demo generation failed:', err);
  }
}

generateDemo();
