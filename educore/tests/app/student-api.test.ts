import { apiRequest, loginWithCode, getMe, joinSession, submitSession, getSessionResult, reportCheatEvent, getStudentProfile, updateStudentProfile, getSessionDetail, startSession, submitSessionAnswer } from '@/lib/student-app/api';

const mockStudent = { id: 's1', fullName: 'Бат', role: 'student' as const, code: 'S-1001' };

const makeFetchResponse = (body: unknown, status = 200, ok = true) => ({
  ok,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('makes a GET request and unwraps envelope', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ data: { id: '1', name: 'test' } }),
    );

    const result = await apiRequest('/api/test');

    expect(result).toEqual({ id: '1', name: 'test' });
  });

  it('returns raw data when no envelope', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ id: '1', name: 'test' }),
    );

    const result = await apiRequest('/api/test');

    expect(result).toEqual({ id: '1', name: 'test' });
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse('Not found', 404, false),
    );

    await expect(apiRequest('/api/missing')).rejects.toThrow();
  });

  it('returns undefined for 204 status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => '',
    });

    const result = await apiRequest('/api/empty');

    expect(result).toBeUndefined();
  });

  it('sets auth headers when student provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ data: {} }),
    );

    await apiRequest('/api/test', { student: mockStudent });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('x-user-id')).toBe('s1');
    expect(headers.get('x-user-role')).toBe('student');
  });
});

describe('loginWithCode', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: mockStudent }),
    );
  });

  afterEach(() => {
    global.fetch = (global as Record<string, unknown>).__originalFetch as typeof fetch;
  });

  it('sends POST with code in body', async () => {
    await loginWithCode('S-1001');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ code: 'S-1001' });
  });
});

describe('getMe', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: mockStudent }),
    );
  });

  it('sends student headers', async () => {
    await getMe(mockStudent);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/me');
    const headers = init.headers as Headers;
    expect(headers.get('x-user-id')).toBe('s1');
  });
});

describe('session flow', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: { sessionId: 'sess-1' } }),
    );
  });

  it('joinSession sends POST with roomCode', async () => {
    await joinSession(mockStudent, 'ABC123');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/join');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ roomCode: 'ABC123' });
  });

  it('getSessionDetail sends GET with session id', async () => {
    await getSessionDetail(mockStudent, 'sess-1');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/sess-1');
  });

  it('startSession sends POST', async () => {
    await startSession(mockStudent, 'sess-1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/sess-1/start');
    expect(init.method).toBe('POST');
  });

  it('submitSessionAnswer sends answer data', async () => {
    await submitSessionAnswer(mockStudent, 'sess-1', 'q1', {
      selectedOptionId: 'opt-1',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.questionId).toBe('q1');
    expect(body.selectedOptionId).toBe('opt-1');
  });

  it('submitSession sends POST to submit endpoint', async () => {
    await submitSession(mockStudent, 'sess-1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/sess-1/submit');
    expect(init.method).toBe('POST');
  });

  it('getSessionResult fetches result', async () => {
    await getSessionResult(mockStudent, 'sess-1');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/sess-1/result');
  });
});

describe('profile', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: { fullName: 'Бат' } }),
    );
  });

  it('getStudentProfile fetches profile', async () => {
    await getStudentProfile(mockStudent);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/student/profile');
  });

  it('updateStudentProfile sends PUT', async () => {
    await updateStudentProfile(mockStudent, { fullName: 'Бат Дорж' } as never);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('PUT');
  });
});

describe('reportCheatEvent', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: {} }),
    );
  });

  it('sends cheat event with session and event type', async () => {
    const session = { sessionId: 'sess-1', examId: 'e1', questions: [], durationMin: 45 };
    await reportCheatEvent(mockStudent, session as never, 'tab_switch', 'test');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/cheat/event');
    const body = JSON.parse(init.body);
    expect(body.sessionId).toBe('sess-1');
    expect(body.eventType).toBe('tab_switch');
    expect(body.metadata).toBe('test');
  });
});
