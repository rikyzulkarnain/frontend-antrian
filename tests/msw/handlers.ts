import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080/api/v1';

// Default handlers — happy-path responses. Individual tests can override
// per-test with server.use(...).
export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'admin@local' && body.password === 'admin123') {
      return HttpResponse.json({
        data: {
          user: {
            id: 'u1',
            name: 'Administrator',
            email: 'admin@local',
            role: 'admin',
            is_active: true,
            created_at: '2026-05-16T00:00:00Z',
          },
          access_token: 'fake-access-token',
        },
      });
    }
    return HttpResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Email atau password salah' } },
      { status: 401 },
    );
  }),

  http.post(`${API}/queues/:id/rating`, async ({ params, request }) => {
    const body = (await request.json()) as { rating: number };
    return HttpResponse.json({
      data: {
        id: params.id,
        queue_number: 'A-01',
        service_type: 'UMUM',
        status: 'completed',
        counter_id: 1,
        staff: 'Sari W.',
        rating: body.rating,
        feedback: null,
        created_at: '2026-05-16T08:00:00Z',
        called_at: '2026-05-16T08:05:00Z',
        completed_at: '2026-05-16T08:10:00Z',
      },
    });
  }),
];
