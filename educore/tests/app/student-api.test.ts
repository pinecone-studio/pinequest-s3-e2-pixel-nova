import {
  apiRequest,
  createAudioUploadUrl,
  createSnapshotUploadUrl,
  finalizeAudioUpload,
  getAuthUsers,
  getMe,
  getSessionDetail,
  getSessionResult,
  getStudentExamHistory,
  getStudentProfile,
  joinSession,
  loginWithCode,
  reportCheatEvent,
  startSession,
  startSessionWithOptions,
  submitSession,
  submitSessionAnswer,
  updateStudentProfile,
} from '@/lib/student-app/api';

const mockStudent = { id: 's1', fullName: 'Bat', role: 'student' as const, code: 'S-1001' };

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
    expect(headers.get('x-user-name-encoded')).toBe('Bat');
  });
});

describe('auth api', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: mockStudent }),
    );
  });

  it('loginWithCode sends POST with code in body', async () => {
    await loginWithCode('S-1001');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ code: 'S-1001' });
  });

  it('getMe sends student headers', async () => {
    await getMe(mockStudent);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/me');
    const headers = init.headers as Headers;
    expect(headers.get('x-user-id')).toBe('s1');
  });

  it('getAuthUsers loads the user list', async () => {
    await getAuthUsers();

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/users');
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

  it('startSessionWithOptions sends audio readiness in the request body', async () => {
    await startSessionWithOptions(mockStudent, 'sess-1', { audioReady: true });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/sessions/sess-1/start');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ audioReady: true });
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

describe('profile and progress api', () => {
  it('getStudentProfile fetches profile', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: { fullName: 'Bat' } }),
    );

    await getStudentProfile(mockStudent);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/student/profile');
  });

  it('updateStudentProfile sends PUT', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: { fullName: 'Bat Dorj' } }),
    );

    await updateStudentProfile(mockStudent, { fullName: 'Bat Dorj' } as never);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('PUT');
  });

  it('getStudentExamHistory combines sessions and results', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        makeFetchResponse({
          data: [
            {
              examId: 'e1',
              title: 'Mock exam',
              sessionStatus: 'graded',
              score: 80,
              startedAt: '2026-03-01T10:00:00.000Z',
              submittedAt: '2026-03-01T10:30:00.000Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeFetchResponse({
          data: [
            {
              sessionId: 'sess-1',
              examId: 'e1',
              title: 'Mock exam',
              score: 80,
              totalPoints: 10,
              earnedPoints: 8,
              startedAt: '2026-03-01T10:00:00.000Z',
              submittedAt: '2026-03-01T10:30:00.000Z',
            },
          ],
        }),
      );

    const history = await getStudentExamHistory(mockStudent);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      sessionId: 'sess-1',
      examId: 'e1',
      score: 80,
      earnedPoints: 8,
    });
  });
});

describe('reportCheatEvent', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({ data: {} }),
    );
  });

  it('sends cheat event with session and event type', async () => {
    const session = {
      sessionId: 'sess-1',
      roomCode: 'ABC123',
      status: 'in_progress' as const,
      exam: { id: 'e1', title: 'Mock', durationMin: 45 },
      questions: [],
      answers: {},
      currentQuestionIndex: 0,
      timerEndsAt: null,
      startedAt: null,
      lastAnswerAt: null,
      syncStatus: 'ready' as const,
      syncMessage: null,
      entryStatus: 'on_time' as const,
    };
    await reportCheatEvent(mockStudent, session, 'tab_switch', 'test');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/cheat/event');
    const body = JSON.parse(init.body);
    expect(body.sessionId).toBe('sess-1');
    expect(body.eventType).toBe('tab_switch');
    expect(body.metadata).toBe('test');
  });

  it('sends cheat event when the full payload shape is provided', async () => {
    await reportCheatEvent(mockStudent, {
      sessionId: 'sess-1',
      eventType: 'audio_upload_failed',
      source: 'mobile_audio',
      confidence: 0.82,
      metadata: '{"message":"upload failed"}',
      details: { message: 'upload failed' },
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      sessionId: 'sess-1',
      eventType: 'audio_upload_failed',
      source: 'mobile_audio',
      confidence: 0.82,
    });
  });

  it('creates a snapshot upload URL', async () => {
    await createSnapshotUploadUrl(mockStudent, {
      sessionId: 'sess-1',
      mimeType: 'image/jpeg',
      capturedAt: '2026-03-01T10:00:00.000Z',
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/cheat/snapshot-upload-url');
    expect(init.method).toBe('POST');
  });

  it('creates an audio upload URL', async () => {
    await createAudioUploadUrl(mockStudent, {
      sessionId: 'sess-1',
      mimeType: 'audio/m4a',
      sequenceNumber: 1,
      chunkStartedAt: '2026-03-01T10:00:00.000Z',
      chunkEndedAt: '2026-03-01T10:00:30.000Z',
      durationMs: 30000,
      sizeBytes: 1234,
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/cheat/audio-upload-url');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).sequenceNumber).toBe(1);
  });

  it('finalizes an uploaded audio chunk', async () => {
    await finalizeAudioUpload(mockStudent, {
      sessionId: 'sess-1',
      objectKey: 'cheat-audio/sess-1/student-1/chunk-1.m4a',
      mimeType: 'audio/m4a',
      sequenceNumber: 1,
      chunkStartedAt: '2026-03-01T10:00:00.000Z',
      chunkEndedAt: '2026-03-01T10:00:30.000Z',
      durationMs: 30000,
      sizeBytes: 1234,
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/cheat/audio-chunks');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).objectKey).toContain('cheat-audio');
  });
});
