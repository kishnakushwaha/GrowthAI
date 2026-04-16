const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = isLocal 
  ? 'http://localhost:3001'
  : 'https://growthai-backend-814429723132.asia-south1.run.app';

export const API = API_URL;
export const WA_API = 'https://wa.kishnaxai.in'; // GCP VM with Caddy SSL
export default API;
