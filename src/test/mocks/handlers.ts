import { http, HttpResponse } from 'msw'

// Mock API base URL
const API_BASE = 'http://localhost:8001'

export const handlers = [
  // Projects endpoints
  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json({
      projects: [
        {
          id: '1',
          name: 'Test Project',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
  }),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      project: {
        id: 'mock-id',
        ...body,
        status: 'created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
  }),

  http.get(`${API_BASE}/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      project: {
        id: params.id,
        name: 'Mock Project',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })
  }),

  // Analysis endpoints
  http.post(`${API_BASE}/projects/:id/analyze`, () => {
    return HttpResponse.json({
      success: true,
      clips: [
        {
          id: '1',
          start_time: 0,
          end_time: 30,
          title: 'Mock Clip',
          confidence: 0.95,
        },
      ],
    })
  }),

  // Settings endpoints
  http.get(`${API_BASE}/providers/models`, () => {
    return HttpResponse.json({
      openai: ['gpt-4-vision-preview', 'gpt-4'],
      gemini: ['gemini-pro-vision'],
    })
  }),

  // Error scenarios for testing
  http.get(`${API_BASE}/projects/error`, () => {
    return HttpResponse.json(
      { error: 'Mock error for testing' },
      { status: 500 }
    )
  }),
] 