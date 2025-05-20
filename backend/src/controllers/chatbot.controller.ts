import { Request, Response, NextFunction } from 'express';
import { generateResponse } from '../services/openai.service';
import { executeQuery } from '../services/graph.service';

// Explicit handler type definition
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Define interface for references
interface Reference {
  title: string;
  url: string;
}

export const processQuery: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
      return;
    }
    
    // Search for relevant information in the graph database
    // This is a simplified query, you can make it more sophisticated
    const gremlinQuery = `g.V().hasLabel('product').has('title', textContainsRegex('(?i).*${query.replace(/['"]/g, '')}.*')).limit(3)`;
    
    let contextInfo = '';
    const references: Reference[] = [];
    
    try {
      // Get context information from graph database
      const graphResults = await executeQuery(gremlinQuery);
      
      if (graphResults && graphResults._items && graphResults._items.length > 0) {
        // Extract relevant information from each product
        contextInfo = graphResults._items.map((item: any) => {
          const title = item.properties?.title?.[0]?.value || 'Unknown Product';
          const content = item.properties?.content?.[0]?.value || '';
          
          // Add this product to references
          references.push({
            title,
            url: item.properties?.url?.[0]?.value || ''
          });
          
          // Return product information for context
          return `Product: ${title}\nDescription: ${content}\n`;
        }).join('\n');
      }
    } catch (graphError) {
      console.error('Error querying graph database:', graphError);
      // Continue with empty context if graph query fails
    }
    
    // Generate response from Azure OpenAI with context
    const answer = await generateResponse(query, contextInfo);
    
    res.status(200).json({
      success: true,
      response: {
        text: answer,
        references
      }
    });
  } catch (error) {
    next(error);
  }
};