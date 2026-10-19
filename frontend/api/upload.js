import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleUpload({
      request,
      body: request.body,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['text/csv', 'application/vnd.ms-excel'],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async () => undefined,
    });
    return response.status(200).json(result);
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : 'Blob upload failed' });
  }
}
