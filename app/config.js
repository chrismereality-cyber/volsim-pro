export const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5000' 
  : 'https://volsim-api-main.onrender.com';
