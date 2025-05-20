// src/services/scraping.service.ts
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { BlobServiceClient } from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Define interfaces for our data structures
interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  links: string[];
  images: string[];
  metadata: {
    keywords: string[];
    description: string;
    categories: string[];
  };
}

// Constants
const BASE_URL = 'https://www.madewithnestle.ca';
const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER_NAME = 'nestle-scraped-content';

// Helper function to normalize URLs
const normalizeUrl = (url: string, baseUrl: string): string => {
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  } else if (!url.startsWith('http')) {
    return `${baseUrl}/${url}`;
  }
  return url;
};

/**
 * Scrapes the Nestlé website for product information
 * @returns Promise<ScrapedPage[]> Array of scraped pages
 */
export const scrapeNestleWebsite = async (): Promise<ScrapedPage[]> => {
  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({
    headless: true, // Keep this as boolean true, not "new"
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
    
  try {
    console.log('Starting scraping process...');
    const page = await browser.newPage();
    
    // Enhanced browser configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setDefaultNavigationTimeout(60000);
    await page.setJavaScriptEnabled(true);
    
    // Bypass common anti-bot measures
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // Navigate to the main page
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // Get all links on the site
    console.log('Collecting all URLs from the website...');
    const allLinks = await page.evaluate(() => {
      const urls: string[] = [];
      // Look for all links, prioritizing product links
      document.querySelectorAll('a').forEach((link) => {
        if (link.href && link.href.includes('madewithnestle.ca') && 
            !link.href.includes('#') && // Exclude anchor links
            !link.href.includes('?')) { // Exclude query parameters
          urls.push(link.href);
        }
      });
      return [...new Set(urls)]; // Remove duplicates
    });
    
    console.log(`Found ${allLinks.length} unique URLs. Starting to scrape each page...`);
    
    // We'll limit to 15 pages to avoid lengthy processing times
    const pagesToScrape = allLinks.slice(0, 15);
    const scrapedPages: ScrapedPage[] = [];
    
    for (const url of pagesToScrape) {
      try {
        console.log(`Scraping: ${url}`);
        
        // Navigate to the page with timeout and wait until network is idle
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 45000
        });
        
        // Wait for potential lazy-loaded content
        await new Promise(resolve => setTimeout(resolve, 2000));

        
        // Get the page content and use cheerio to parse it
        const pageContent = await page.content();
        
        try {
          const $ = cheerio.load(pageContent);
          
          // Extract the page title
          const title = $('title').text().trim() || 'Untitled Page';
          console.log(`- Page title: ${title}`);
          
          // Extract metadata
          const metaDescription = $('meta[name="description"]').attr('content') || '';
          const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
          
          // Try to extract categories from breadcrumbs or navigation
          const categories: string[] = [];
          $('.breadcrumb li, .nav-item, .breadcrumb-item').each((_, el) => {
            const text = $(el).text().trim();
            if (text && !categories.includes(text)) {
              categories.push(text);
            }
          });
          
          // Extract all text content
          $('script, style').remove(); // Remove script and style elements
          const textContent: string[] = [];
          
          // Target elements that typically contain product information
          $('p, h1, h2, h3, h4, h5, h6, li, .product-description, .content-area').each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 5) { // Ignore very short text
              textContent.push(text);
            }
          });
          
          const content = textContent.join(' ').replace(/\s+/g, ' ').trim();
          
          // Get all internal links
          const pageLinks: string[] = [];
          $('a').each((_, el) => {
            const href = $(el).attr('href');
            if (href && (href.startsWith('/') || href.includes('madewithnestle.ca'))) {
              pageLinks.push(normalizeUrl(href, BASE_URL));
            }
          });
          
          // Get all images
          const images: string[] = [];
          $('img').each((_, el) => {
            const src = $(el).attr('src');
            if (src) {
              images.push(normalizeUrl(src, BASE_URL));
            }
          });
          
          // Extract keywords from content
          const keywords = metaKeywords.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
          
          // Add additional keywords by analyzing content
          const contentWords = content.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3); // Only count words longer than 3 characters
          
          const wordFrequency: Record<string, number> = {};
          contentWords.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
          
          // Get top 10 most common words as additional keywords
          const additionalKeywords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
          
          const allKeywords = [...new Set([...keywords, ...additionalKeywords])];
          
          // Add to scraped pages if we have at least a title
          if (title) {
            scrapedPages.push({
              url,
              title,
              content: content || `Information about ${title}`,
              links: pageLinks,
              images,
              metadata: {
                keywords: allKeywords,
                description: metaDescription,
                categories
              }
            });
            
            console.log(`- Successfully scraped: ${title}`);
          }
        } catch (cheerioError) {
          console.error(`- Error parsing HTML with Cheerio: ${cheerioError}`);
          
          // Fallback to direct page evaluation if Cheerio fails
          const basicInfo = await page.evaluate(() => {
            const pageTitle = document.title || 'Untitled Page';
            const allText: string[] = [];
            
            document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
              const text = el.textContent?.trim();
              if (text && text.length > 5) {
                allText.push(text);
              }
            });
            
            const pageImages: string[] = [];
            document.querySelectorAll('img').forEach(img => {
              if (img.src) pageImages.push(img.src);
            });
            
            return {
              title: pageTitle,
              content: allText.join(' '),
              images: pageImages
            };
          });
          
          // Add basic info to scraped pages
          scrapedPages.push({
            url,
            title: basicInfo.title,
            content: basicInfo.content || `Information about ${basicInfo.title}`,
            links: [url],
            images: basicInfo.images,
            metadata: {
              keywords: basicInfo.title.toLowerCase().split(/\s+/),
              description: basicInfo.content.substring(0, 150) + '...',
              categories: []
            }
          });
          
          console.log(`- Scraped basic info using JS evaluation: ${basicInfo.title}`);
        }
        
        // Wait between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1500));

        
      } catch (error) {
        console.error(`- Error scraping ${url}:`, error);
        // Continue with the next page even if this one fails
      }
    }
    
    console.log(`Completed scraping ${scrapedPages.length} pages successfully`);
    return scrapedPages;
    
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
};

/**
 * Saves the scraped content to Azure Blob Storage or local file
 * @param scrapedPages Array of scraped pages to save
 */
export const saveContentToBlob = async (scrapedPages: ScrapedPage[]): Promise<void> => {
  if (!STORAGE_CONNECTION_STRING) {
    console.log('No Azure storage connection string provided, saving to local file instead');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save to a timestamped file
    const timestamp = new Date().getTime();
    const filePath = path.join(dataDir, `scraped_content_${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(scrapedPages, null, 2));
    console.log(`Scraped content saved to ${filePath}`);
    
    // Save an index file for easier retrieval
    const indexContent = {
      scrapeTime: new Date().toISOString(),
      pageCount: scrapedPages.length,
      pages: scrapedPages.map(page => ({
        url: page.url,
        title: page.title
      }))
    };
    
    const indexPath = path.join(dataDir, `index_${timestamp}.json`);
    fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
    console.log(`Index saved to ${indexPath}`);
    
    return;
  }
  
  try {
    console.log('Connecting to Azure Blob Storage...');
    const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
    
    // Create container if it doesn't exist
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const containerExists = await containerClient.exists();
    
    if (!containerExists) {
      console.log(`Creating container: ${CONTAINER_NAME}`);
      await containerClient.create();
    }
    
    // Generate a timestamp for this set of blobs
    const timestamp = new Date().getTime();
    
    // Save each page as a separate blob
    for (const [index, page] of scrapedPages.entries()) {
      const blobName = `page_${index}_${timestamp}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      console.log(`Uploading blob: ${blobName}`);
      const content = JSON.stringify(page);
      await blockBlobClient.upload(content, content.length);
    }
    
    // Save an index file with all URLs
    const indexContent = {
      scrapeTime: new Date().toISOString(),
      pageCount: scrapedPages.length,
      pages: scrapedPages.map(page => ({
        url: page.url,
        title: page.title
      }))
    };
    
    const indexBlobClient = containerClient.getBlockBlobClient(`index_${timestamp}.json`);
    const indexContentStr = JSON.stringify(indexContent);
    await indexBlobClient.upload(indexContentStr, indexContentStr.length);
    
    console.log('All content saved to blob storage');
  } catch (error) {
    console.error('Error saving to blob storage:', error);
    throw error;
  }
};

/**
 * Retrieves the scraped content from Azure Blob Storage or local file
 * @returns Promise<ScrapedPage[]> Array of scraped pages
 */
export const getScrapedContent = async (): Promise<ScrapedPage[]> => {
  try {
    // If we have Azure storage configured, retrieve from there
    if (STORAGE_CONNECTION_STRING) {
      console.log('Retrieving content from Azure Blob Storage...');
      const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      
      // Check if container exists
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        console.log('No scraped content found in blob storage');
        return [];
      }
      
      // Find the latest index file
      let latestIndex: string | null = null;
      let latestTime = 0;
      
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.startsWith('index_')) {
          const timestamp = parseInt(blob.name.split('_')[1].split('.')[0]);
          if (timestamp > latestTime) {
            latestTime = timestamp;
            latestIndex = blob.name;
          }
        }
      }
      
      if (!latestIndex) {
        console.log('No index file found in blob storage');
        return [];
      }
      
      // Download and parse the index file
      const indexBlobClient = containerClient.getBlobClient(latestIndex);
      const downloadResponse = await indexBlobClient.download();
      const indexContent = await streamToString(downloadResponse.readableStreamBody!);
      const index = JSON.parse(indexContent);
      
      // Download each page
      const scrapedPages: ScrapedPage[] = [];
      for (const page of index.pages) {
        // We need to find the corresponding page blob
        for await (const blob of containerClient.listBlobsFlat()) {
          if (blob.name.startsWith(`page_`) && blob.name.includes(latestTime.toString())) {
            const pageBlobClient = containerClient.getBlobClient(blob.name);
            const pageDownloadResponse = await pageBlobClient.download();
            const pageContent = await streamToString(pageDownloadResponse.readableStreamBody!);
            scrapedPages.push(JSON.parse(pageContent));
            break;
          }
        }
      }
      
      return scrapedPages;
    } else {
      // If no Azure storage, check for local file
      console.log('Retrieving content from local file...');
      
      const dataDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) {
        console.log('Data directory does not exist');
        return [];
      }
      
      // Find the latest scraped content file
      const files = fs.readdirSync(dataDir);
      const scrapedFiles = files.filter((f: string) => f.startsWith('scraped_content_'));
      
      if (scrapedFiles.length === 0) {
        console.log('No scraped content files found');
        return [];
      }
      
      // Sort by timestamp (descending)
      scrapedFiles.sort((a: string, b: string) => {
        const timeA = parseInt(a.split('_')[2].split('.')[0]);
        const timeB = parseInt(b.split('_')[2].split('.')[0]);
        return timeB - timeA;
      });
      
      // Read the latest file
      const latestFile = path.join(dataDir, scrapedFiles[0]);
      console.log(`Reading content from ${latestFile}`);
      
      const content = fs.readFileSync(latestFile, 'utf8');
      const parsedContent = JSON.parse(content);
      
      console.log(`Found ${parsedContent.length} pages in the file`);
      return parsedContent;
    }
  } catch (error) {
    console.error('Error retrieving scraped content:', error);
    return [];
  }
};

/**
 * Helper function to convert a readable stream to a string
 * @param readableStream The readable stream to convert
 * @returns Promise<string> The stream content as a string
 */
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}