# Inecta Documentation Chat Assistant

A RAG (Retrieval-Augmented Generation) chat interface for querying Inecta Food ERP documentation using Supabase vector database.

## Setup

### 1. Install Dependencies

```bash
npm install openai @anthropic-ai/sdk
```

### 2. Environment Variables

Add to your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

Run the SQL function in your Supabase SQL editor:

```sql
-- See sql/create_match_documents_function.sql
```

This creates the `match_documents` RPC function for vector similarity search.

### 4. Database Schema

Ensure you have a `documents` table with:

- `id` (bigint)
- `content` (text)
- `embedding` (vector(1536))
- `metadata` (jsonb) - should contain `title` field

## Features

- **RAG Implementation**: Uses OpenAI embeddings and Supabase vector search
- **Claude Integration**: Uses Anthropic Claude Sonnet 4 for responses
- **Source Citations**: Shows retrieved documents with similarity scores
- **Real-time Chat**: Streaming-ready interface with loading states
- **Styled to Match**: Matches existing app styling with glass-card effects

## Usage

Navigate to `/chat` to access the chat interface. The assistant will:

1. Generate embeddings for user queries
2. Search Supabase vector database for relevant documentation
3. Use retrieved context to generate accurate responses via Claude
4. Display source documents with similarity scores


