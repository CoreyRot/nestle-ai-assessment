# Nestlé AI Chatbot

## AI-Based Chatbot for Made with Nestlé Canada

This project is an AI-powered chatbot for the Made with Nestlé Canada website (https://www.madewithnestle.ca/). The chatbot uses Azure's AI services to provide information about Nestlé products, recipes, and nutritional information.

### Features

- **Interactive Chatbot Interface**: Pop-out chatbot positioned in the right corner of the website
- **AI-Powered Responses**: Utilizes Azure OpenAI to generate helpful, accurate responses about Nestlé products
- **Web Scraping**: Automatically collects and updates content from the Made with Nestlé website
- **GraphRAG Architecture**: Combines graph database and vector search for enhanced context awareness
- **Custom Styling**: Seamlessly integrates with the Made with Nestlé website design

### Technologies Used

#### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

#### Backend
- Node.js
- Express
- TypeScript

#### Azure Services
- Azure OpenAI Service
- Azure AI Search
- Azure Cosmos DB with Gremlin API

### Project Structure

```
nestle-ai-chatbot/
├── frontend/            # React frontend application
├── backend/             # Express backend API
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── server.ts    # Express server entry point
│   ├── data/            # Scraped data storage
│   └── package.json
└── README.md
```

### Getting Started

#### Prerequisites

- Node.js (v16 or higher)
- Azure subscription with access to:
  - Azure OpenAI
  - Azure AI Search
  - Azure Cosmos DB

#### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/coreyrotstein/nestle-ai-chatbot.git
   cd nestle-ai-chatbot
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with your Azure credentials:
   ```
   PORT=5000

   # Azure OpenAI
   AZURE_OPENAI_ENDPOINT=your_openai_endpoint
   AZURE_OPENAI_API_KEY=your_openai_api_key
   AZURE_OPENAI_DEPLOYMENT=your_openai_deployment
   AZURE_OPENAI_API_VERSION=2024-12-01-preview

   # Azure Search
   AZURE_SEARCH_ENDPOINT=your_search_endpoint
   AZURE_SEARCH_API_KEY=your_search_api_key
   AZURE_SEARCH_INDEX_NAME=nestle-products-index

   # Azure Cosmos DB
   AZURE_COSMOS_ENDPOINT=your_cosmos_endpoint
   AZURE_COSMOS_GREMLIN_ENDPOINT=your_gremlin_endpoint
   AZURE_COSMOS_KEY=your_cosmos_key
   AZURE_COSMOS_DATABASE=NestleProductsDB
   AZURE_COSMOS_GRAPH=ProductGraph
   ```

#### Running the Application

1. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to http://localhost:5173

### License

This project is a technical assessment developed for Nestlé Canada.