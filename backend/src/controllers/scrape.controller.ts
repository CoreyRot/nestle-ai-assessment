// src/controllers/scrape.controller.ts
import { Request, Response } from 'express';
import { 
  scrapeNestleWebsite, 
  saveContentToBlob, 
  getScrapedContent as fetchScrapedContent 
} from '../services/scraping.service';

export const scrapeWebsite = async (req: Request, res: Response) => {
  try {
    console.log('Starting website scraping process...');
    const result = await scrapeNestleWebsite();
    
    if (result && result.length > 0) {
      await saveContentToBlob(result);
      
      res.status(200).json({
        success: true,
        message: 'Website scraped successfully',
        pageCount: result.length
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No pages were scraped',
        pageCount: 0
      });
    }
  } catch (error) {
    console.error('Error scraping website:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping website',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getScrapedContent = async (req: Request, res: Response) => {
  try {
    const content = await fetchScrapedContent();
    
    if (content && content.length > 0) {
      res.status(200).json({
        success: true,
        message: 'Content retrieved successfully',
        pageCount: content.length,
        content: content
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No content found. Try scraping the website first.',
        pageCount: 0,
        content: []
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving scraped content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};