interface N8nWebhookResponse {
  success: boolean;
  message?: string;
  sourceId?: string;
  chunksCreated?: number;
  error?: string;
  data?: unknown;
  sections?: Array<{
    type: string;
    title: string;
    content: string;
    sources?: string[];
  }>;
  dataPoints?: number;
  total?: number;
}

interface N8nRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class N8nClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
    this.defaultTimeout = 30000; // 30 seconds
    this.defaultRetries = 2;

    if (!this.baseUrl) {
      console.warn('N8N_WEBHOOK_URL environment variable is not set');
    }
  }

  async sendWebhook(
    endpoint: string, 
    data: unknown, 
    options: N8nRequestOptions = {}
  ): Promise<N8nWebhookResponse> {
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } = options;
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Log attempt
        console.log(JSON.stringify({
          level: 'warn',
          timestamp: new Date().toISOString(),
          message: `n8n webhook attempt ${attempt + 1}/${retries + 1} failed`,
          endpoint,
          error: lastError.message
        }));

        // Don't retry on the last attempt
        if (attempt < retries) {
          await this.delay(options.retryDelay || 1000 * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  async sendWithFile(
    endpoint: string, 
    formData: FormData, 
    options: N8nRequestOptions = {}
  ): Promise<N8nWebhookResponse> {
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } = options;
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Log attempt
        console.log(JSON.stringify({
          level: 'warn',
          timestamp: new Date().toISOString(),
          message: `n8n file upload attempt ${attempt + 1}/${retries + 1} failed`,
          endpoint,
          error: lastError.message
        }));

        // Don't retry on the last attempt
        if (attempt < retries) {
          await this.delay(options.retryDelay || 1000 * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

const n8nClient = new N8nClient();
export default n8nClient;
