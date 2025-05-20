import { Router } from 'express';
import { scrapeWebsite, getScrapedContent } from '../controllers/scrape.controller';

const router = Router();

router.post('/start', scrapeWebsite);
router.get('/start', scrapeWebsite);

router.get('/content', getScrapedContent);
router.get('/content', getScrapedContent);

export default router;