import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendChatbotQuery = async (query: string) => {
  try {
    const response = await api.post('/chatbot/query', { query });
    return response.data;
  } catch (error) {
    console.error('Error sending query to chatbot:', error);
    throw error;
  }
};

export default api;