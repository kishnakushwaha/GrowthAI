// In production, fallback to our new Google Cloud Run backend if env var is missing
const API_URL = import.meta.env.VITE_API_URL || 'https://growthai-backend-814429723132.asia-south1.run.app';

export const API = API_URL;
export default API;
