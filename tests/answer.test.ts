import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../src/app/api/answer/route'
import { NextRequest } from 'next/server'

function makeRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/answer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 400 when user_id is missing', async () => {
    const req = makeRequest('http://localhost/api/answer')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('user_id required')
  })

  it('proxies POST to upstream API and returns data', async () => {
    const mockData = { correct: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData),
    }))

    const req = makeRequest('http://localhost/api/answer?user_id=42', { card_id: 1, answer: 'yes' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockData)

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=42')
    expect(calledUrl).toContain('/api/answer')
  })
})
