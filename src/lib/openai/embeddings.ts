interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface EmbeddingCache {
  [key: string]: {
    embedding: number[];
    timestamp: number;
  };
}

// Simple in-memory cache (in production, use Redis or similar)
const embeddingCache: EmbeddingCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function generateEmbedding(text: string): Promise<number[]> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > 8000) {
    throw new Error('Text too long for embedding (max 8000 characters)');
  }

  // Check cache first
  const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 50)}`;
  const cached = embeddingCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message: 'Using cached embedding',
      textLength: text.length
    }));
    return cached.embedding;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  console.log(`OpenAI Key Loaded: ${!!apiKey}, Length: ${apiKey?.length}, Starts with: ${apiKey?.substring(0, 4)}`);
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.trim(),
          dimensions: 1536
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse error JSON' } }));
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: OpenAIEmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No embedding returned from OpenAI API');
      }

      const embedding = data.data[0].embedding;

      // Cache the result
      embeddingCache[cacheKey] = {
        embedding,
        timestamp: Date.now()
      };

      // Log successful generation
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Generated embedding successfully',
        textLength: text.length,
        tokensUsed: data.usage.total_tokens,
        attempt: attempt + 1
      }));

      return embedding;

    } catch (error) {
      lastError = error as Error;
      let errorDetails = lastError.message;
      if (error instanceof Response) {
        try {
          const errorBody = await error.json();
          errorDetails = JSON.stringify(errorBody);
        } catch {
          errorDetails = await error.text();
        }
      }
      console.log(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message: `Embedding generation attempt ${attempt + 1}/${maxRetries} failed`,
        error: errorDetails
      }));

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Process in batches to avoid rate limits
  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error) {
      console.error(`Failed to generate embeddings for batch starting at index ${i}:`, error);
      throw error;
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Utility function to clean up old cache entries
export function cleanupEmbeddingCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of Object.entries(embeddingCache)) {
    if (now - value.timestamp > CACHE_TTL) {
      delete embeddingCache[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message: 'Cleaned up embedding cache',
      entriesRemoved: cleaned
    }));
  }
}

// Run cleanup every hour
setInterval(cleanupEmbeddingCache, 60 * 60 * 1000);



