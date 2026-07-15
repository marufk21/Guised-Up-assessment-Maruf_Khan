const feedResponse = {
  data: [
    {
      id: 12,
      user: { id: 2, name: 'Maya Demo' },
      text: 'A thoughtful post.',
      image_url: null,
      authenticity_score: 0.8,
      embedding_status: 'ready',
      created_at: '2026-07-13T10:00:00.000Z',
      updated_at: '2026-07-13T10:00:00.000Z',
      ranking: {
        score: 0.7,
        authenticity: 0.8,
        relationship_depth: 0.5,
        semantic_similarity: 0.6,
        time_decay: 0.9,
      },
    },
  ],
  meta: {
    current_page: 1,
    per_page: 20,
    total: 1,
    last_page: 1,
    has_more_pages: false,
    semantic_ranking_available: true,
  },
};

const searchResponse = {
  data: [
    {
      id: 12,
      user: { id: 2, name: 'Maya Demo' },
      text: 'A quiet morning walk before work.',
      image_url: null,
      authenticity_score: 0.74,
      embedding_status: 'ready',
      created_at: '2026-07-13T08:00:00Z',
      updated_at: '2026-07-13T08:00:00Z',
      semantic_similarity: 0.91,
    },
  ],
};

const emptySearchResponse = { data: [] };

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body === null ? '' : JSON.stringify(body)),
  };
}

describe('mobile API client', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000/api/';
    process.env.EXPO_PUBLIC_API_TOKEN = 'local-test-token';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_API_TOKEN;
  });

  it('normalizes the base URL and sends the authenticated feed request', async () => {
    global.fetch.mockResolvedValue(response(200, feedResponse));
    const { fetchFeed } = require('./api');

    await expect(fetchFeed(1)).resolves.toEqual(feedResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/feed?page=1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer local-test-token',
        }),
      }),
    );
  });

  it('sends the exact reaction payload and JSON content type', async () => {
    const interactionResponse = {
      data: {
        id: 4,
        user_id: 1,
        post_id: 12,
        type: 'reaction',
        created_at: '2026-07-13T12:00:00.000Z',
      },
    };
    global.fetch.mockResolvedValue(response(201, interactionResponse));
    const { createInteraction } = require('./api');

    await expect(createInteraction(12)).resolves.toEqual(interactionResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/interactions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ post_id: 12, type: 'reaction' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('turns 401 and empty success responses into safe errors', async () => {
    const { fetchFeed } = require('./api');
    global.fetch.mockResolvedValueOnce(response(401, { message: 'Unauthenticated.' }));

    let authenticationError;
    try {
      await fetchFeed(1);
    } catch (error) {
      authenticationError = error;
    }

    expect(authenticationError).toMatchObject({ status: 401 });
    expect(authenticationError.message).not.toContain('local-test-token');

    global.fetch.mockResolvedValue(response(200, null));
    await expect(fetchFeed(1)).rejects.toThrow('unexpected response');
  });

  it('sends the search request with an encoded query string', async () => {
    const abortController = new AbortController();
    global.fetch.mockResolvedValue(response(200, searchResponse));
    const { searchPosts } = require('./api');

    await expect(
      searchPosts('quiet morning', abortController.signal),
    ).resolves.toEqual(searchResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/search?q=quiet%20morning',
      expect.objectContaining({
        method: 'GET',
        signal: abortController.signal,
        headers: expect.objectContaining({
          Authorization: 'Bearer local-test-token',
        }),
      }),
    );
  });

  it('handles empty search results correctly', async () => {
    const abortController = new AbortController();
    global.fetch.mockResolvedValue(response(200, emptySearchResponse));
    const { searchPosts } = require('./api');

    await expect(
      searchPosts('no-matching-results', abortController.signal),
    ).resolves.toEqual(emptySearchResponse);
  });

  it('handles network failure as a safe ApiError', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    const { fetchFeed } = require('./api');

    let networkError;
    try {
      await fetchFeed(1);
    } catch (error) {
      networkError = error;
    }

    expect(networkError.kind).toBe('network');
    expect(networkError.message).toContain('Unable to reach the API');
    expect(networkError.status).toBeUndefined();
  });

  it('extracts field-level validation errors from 422 responses', async () => {
    const validationBody = {
      message: 'The text field is required.',
      errors: { text: ['The text field is required.'] },
    };
    global.fetch.mockResolvedValue(response(422, validationBody));
    const { fetchFeed } = require('./api');

    let validationError;
    try {
      await fetchFeed(1);
    } catch (error) {
      validationError = error;
    }

    expect(validationError.kind).toBe('http');
    expect(validationError.status).toBe(422);
    expect(validationError.validationErrors).toEqual({
      text: ['The text field is required.'],
    });
  });

  it('handles 500 server error with a sanitized message', async () => {
    global.fetch.mockResolvedValue(
      response(500, { message: 'Server error.' }),
    );
    const { fetchFeed } = require('./api');

    let serverError;
    try {
      await fetchFeed(1);
    } catch (error) {
      serverError = error;
    }

    expect(serverError.kind).toBe('http');
    expect(serverError.status).toBe(500);
    expect(serverError.message).toBe('Server error.');
  });

  it('throws a configuration error when EXPO_PUBLIC_API_BASE_URL is missing', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    const { fetchFeed, getConfigurationError } = require('./api');

    const configError = getConfigurationError();
    expect(configError).toContain('EXPO_PUBLIC_API_BASE_URL');

    let thrownError;
    try {
      await fetchFeed(1);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError.kind).toBe('configuration');
    expect(thrownError.message).toContain('EXPO_PUBLIC_API_BASE_URL');
  });
});
