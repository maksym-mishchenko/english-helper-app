import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../src/app/api/triage/route'
import { NextRequest } from 'next/server'

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

function makePostRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : '{}',
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/triage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults user_id to "0" when not provided', async () => {
    const mockData = { words: ['apple'], total: 1 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData),
    }))

    const req = makeGetRequest('http://localhost/api/triage')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const fetchMock = vi.mocked(fetch)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=0')
  })

  it('uses provided user_id and pack', async () => {
    const mockData = { words: ['banana'], total: 1 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData),
    }))

    const req = makeGetRequest('http://localhost/api/triage?user_id=5&pack=fruits')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockData)

    const fetchMock = vi.mocked(fetch)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=5')
    expect(calledUrl).toContain('pack=fruits')
  })

  it('returns 502 when upstream fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const req = makeGetRequest('http://localhost/api/triage')
    const res = await GET(req)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data).toHaveProperty('words')
  })
})

describe('POST /api/triage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('proxies POST successfully and returns result', async () => {
    const mockResult = { success: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResult),
    }))

    const req = makePostRequest('http://localhost/api/triage?user_id=3', { word_id: 10, result: 'know' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockResult)

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=3')
  })

  it('defaults user_id to "0" when not provided in POST', async () => {
    const mockResult = { success: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResult),
    }))

    const req = makePostRequest('http://localhost/api/triage', { word_id: 5 })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const fetchMock = vi.mocked(fetch)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=0')
  })

  it('returns 502 when upstream POST throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const req = makePostRequest('http://localhost/api/triage', {})
    const res = await POST(req)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toBe('API error')
  })
})
