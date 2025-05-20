// src/services/search.service.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
const searchApiKey = process.env.AZURE_SEARCH_API_KEY || '';
const searchIndexName = process.env.AZURE_SEARCH_INDEX_NAME || 'nestle-products-index';

/**
 * Create the search index if it doesn't exist
 */
export const createSearchIndex = async (): Promise<void> => {
  try {
    const url = `${searchEndpoint}/indexes/${searchIndexName}?api-version=2023-11-01`;
    
    // Check if index exists
    try {
      await axios.get(url, {
        headers: {
          'api-key': searchApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Search index '${searchIndexName}' already exists`);
      return;
    } catch (error) {
      // If index doesn't exist, create it
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`Creating search index '${searchIndexName}'...`);
        
        const indexDefinition = {
          name: searchIndexName,
          fields: [
            {
              name: "id",
              type: "Edm.String",
              key: true,
              searchable: false,
              filterable: false,
              facetable: false,
              sortable: false
            },
            {
              name: "url",
              type: "Edm.String",
              searchable: true,
              filterable: true,
              facetable: false,
              sortable: false
            },
            {
              name: "title",
              type: "Edm.String",
              searchable: true,
              filterable: true,
              facetable: false,
              sortable: true
            },
            {
              name: "content",
              type: "Edm.String",
              searchable: true,
              filterable: false,
              facetable: false,
              sortable: false
            },
            {
              name: "category",
              type: "Edm.String",
              searchable: true,
              filterable: true,
              facetable: true,
              sortable: true
            },
            {
              name: "keywords",
              type: "Collection(Edm.String)",
              searchable: true,
              filterable: true,
              facetable: true,
              sortable: false
            },
            {
              name: "description",
              type: "Edm.String",
              searchable: true,
              filterable: false,
              facetable: false,
              sortable: false
            },
            {
              name: "vectorField",
              type: "Collection(Edm.Single)",
              dimensions: 1536,
              vectorSearchProfile: "vector-profile"
            }
          ],
          vectorSearch: {
            profiles: [
              {
                name: "vector-profile",
                algorithm: "hnsw",
                algorithmConfiguration: "default"
              }
            ],
            algorithmConfigurations: [
              {
                name: "default",
                kind: "hnsw",
                parameters: {
                  m: 4,
                  efConstruction: 400,
                  efSearch: 500,
                  metric: "cosine"
                }
              }
            ]
          },
          semantic: {
            configurations: [
              {
                name: "my-semantic-config",
                prioritizedFields: {
                  titleField: {
                    fieldName: "title"
                  },
                  contentFields: [
                    {
                      fieldName: "content"
                    },
                    {
                      fieldName: "description"
                    }
                  ],
                  keywordsFields: [
                    {
                      fieldName: "keywords"
                    }
                  ]
                }
              }
            ]
          }
        };
        
        await axios.put(url, indexDefinition, {
          headers: {
            'api-key': searchApiKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Search index '${searchIndexName}' created successfully`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating search index:', error);
    throw error;
  }
};

/**
 * Upload documents to the search index
 * @param documents The documents to upload
 */
export const uploadDocuments = async (documents: any[]): Promise<void> => {
  try {
    const url = `${searchEndpoint}/indexes/${searchIndexName}/docs/index?api-version=2023-11-01`;
    
    // Prepare documents for upload
    const actions = documents.map(doc => ({
      "@search.action": "upload",
      ...doc
    }));
    
    // Upload documents in batches of 100
    const batchSize = 100;
    for (let i = 0; i < actions.length; i += batchSize) {
      const batch = actions.slice(i, i + batchSize);
      
      await axios.post(url, { value: batch }, {
        headers: {
          'api-key': searchApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Uploaded batch ${i / batchSize + 1} of ${Math.ceil(actions.length / batchSize)}`);
    }
    
    console.log('All documents uploaded successfully');
  } catch (error) {
    console.error('Error uploading documents:', error);
    throw error;
  }
};

/**
 * Search for documents in the index
 * @param query The search query
 * @param filter Optional filter for the search
 * @returns The search results
 */
export const searchDocuments = async (query: string, filter?: string): Promise<any> => {
  try {
    const url = `${searchEndpoint}/indexes/${searchIndexName}/docs/search?api-version=2023-11-01`;
    
    const searchOptions = {
      count: true,
      filter: filter,
      queryType: 'simple',
      search: query,
      searchFields: 'title,content,description,keywords',
      select: 'id,url,title,content,category,keywords,description',
      top: 10
    };
    
    const response = await axios.post(url, searchOptions, {
      headers: {
        'api-key': searchApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Search for documents using vector search
 * @param vector The vector to search with
 * @param filter Optional filter for the search
 * @returns The search results
 */
export const vectorSearch = async (vector: number[], filter?: string): Promise<any> => {
  try {
    const url = `${searchEndpoint}/indexes/${searchIndexName}/docs/search?api-version=2023-11-01`;
    
    const searchOptions = {
      count: true,
      filter: filter,
      vectors: [
        {
          value: vector,
          fields: "vectorField",
          k: 10
        }
      ],
      select: 'id,url,title,content,category,keywords,description'
    };
    
    const response = await axios.post(url, searchOptions, {
      headers: {
        'api-key': searchApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error performing vector search:', error);
    throw error;
  }
};

/**
 * Hybrid search (combines keyword and vector search)
 * @param query The text query
 * @param vector The vector representation of the query
 * @param filter Optional filter for the search
 * @returns The search results
 */
export const hybridSearch = async (query: string, vector: number[], filter?: string): Promise<any> => {
  try {
    const url = `${searchEndpoint}/indexes/${searchIndexName}/docs/search?api-version=2023-11-01`;
    
    const searchOptions = {
      count: true,
      filter: filter,
      queryType: 'simple',
      search: query,
      searchFields: 'title,content,description,keywords',
      vectors: [
        {
          value: vector,
          fields: "vectorField",
          k: 10
        }
      ],
      select: 'id,url,title,content,category,keywords,description',
      top: 10
    };
    
    const response = await axios.post(url, searchOptions, {
      headers: {
        'api-key': searchApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
};

export default {
  createSearchIndex,
  uploadDocuments,
  searchDocuments,
  vectorSearch,
  hybridSearch
};