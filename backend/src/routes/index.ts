// src/routes/index.ts
import { Router } from 'express';
import scrapeRoutes from './scrape.routes';
import chatbotRoutes from './chatbot.routes';
import graphRoutes from './graph.routes';
import searchRoutes from './search.routes';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Nestlé Chatbot API - Available endpoints:',
    endpoints: [
      '/api/test',
      '/api/scrape/content',
      '/api/scrape/start',
      '/api/chatbot/query',
      '/api/graph/load',
      '/api/graph/query',
      '/api/search/index',
      '/api/search/query'
    ]
  });
});

router.use('/scrape', scrapeRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/graph', graphRoutes);
router.use('/search', searchRoutes);

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'API is working' });
});

export default router;