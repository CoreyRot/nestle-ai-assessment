// src/services/indexer.service.ts
import { getScrapedContent } from './scraping.service';
import { createSearchIndex, uploadDocuments } from './search.service';
import { generateEmbeddings } from './openai.service';

/**
 * Convert scraped content to search documents
 * @param products The scraped products
 * @returns The prepared search documents
 */
const prepareSearchDocuments = async (products: any[]): Promise<any[]> => {
  const documents = [];
  
  for (const product of products) {
    try {
      // Extract the ID from the URL
      const id = product.url.replace(/https:\/\/www\.madewithnestle\.ca\//g, '');
      
      // Determine category
      const category = product.metadata && 
                     product.metadata.categories && 
                     product.metadata.categories.length > 0 
                       ? product.metadata.categories[0] 
                       : 'unknown';
      
      // Extract keywords
      const keywords = product.metadata && product.metadata.keywords
                     ? product.metadata.keywords 
                     : [];
      
      // Extract description
      const description = product.metadata && product.metadata.description
                      ? product.metadata.description
                      : '';
      
      // Generate vector embedding for the content
      const contentToEmbed = `${product.title} ${product.content} ${description} ${keywords.join(' ')}`;
      const vectorField = await generateEmbeddings(contentToEmbed);
      
      // Create the document
      documents.push({
        id,
        url: product.url,
        title: product.title,
        content: product.content,
        category,
        keywords,
        description,
        vectorField
      });
      
      console.log(`Prepared document for: ${product.title}`);
    } catch (error) {
      console.error(`Error preparing document for ${product.title}:`, error);
    }
  }
  
  return documents;
};

/**
 * Index the scraped content into Azure Cognitive Search
 */
export const indexScrapedContent = async (): Promise<void> => {
  try {
    console.log('Starting to index content...');
    
    // Create the search index if it doesn't exist
    await createSearchIndex();
    
    // Get the scraped content
    const products = await getScrapedContent();
    
    if (products.length === 0) {
      console.log('No products found. Please scrape the website first.');
      return;
    }
    
    console.log(`Found ${products.length} products to index`);
    
    // Prepare documents for indexing
    const documents = await prepareSearchDocuments(products);
    
    if (documents.length === 0) {
      console.log('No documents to index');
      return;
    }
    
    console.log(`Prepared ${documents.length} documents for indexing`);
    
    // Upload documents to the search index
    await uploadDocuments(documents);
    
    console.log('Indexing completed successfully');
  } catch (error) {
    console.error('Error indexing content:', error);
    throw error;
  }
};

export default {
  indexScrapedContent
};