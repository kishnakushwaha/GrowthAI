// Override any old environment variables specifically to force Cloud Run in production
const API_URL = 'https://growthai-backend-814429723132.asia-south1.run.app';

export const API = API_URL;
export const WA_API = 'https://growthai-1-lqr6.onrender.com'; // Default to localhost until Render deployment
export default API;
