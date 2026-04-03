// Override any old environment variables specifically to force Cloud Run in production
const API_URL = 'https://growthai-backend-814429723132.asia-south1.run.app';

export const API = API_URL;
export const WA_API = 'http://localhost:4000'; // Default to localhost until Render deployment
export default API;
