import { createLogger } from '../utils/Logger';

const logger = createLogger('CloudflareKvClient');

const KV_KEY = process.env.CLOUDFLARE_KV_KEY || 'cinemathequeMovies';

export class CloudflareKvClient {
  static isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_KV_NAMESPACE_ID &&
      process.env.CLOUDFLARE_API_TOKEN
    );
  }

  static async putMovies(movies: unknown[]): Promise<void> {
    if (!CloudflareKvClient.isConfigured()) {
      logger.warn('Cloudflare KV credentials not configured, skipping upload.');
      return;
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID!;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;

    const url =
      `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
      `/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(KV_KEY)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movies),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Cloudflare KV upload failed (${response.status}): ${errorBody}`
      );
    }

    logger.info('Movies uploaded to Cloudflare KV.');
  }
}
