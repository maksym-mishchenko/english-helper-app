import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../src/app/api/stats/route'
import { NextRequest } from 'next/server'

function makeRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 400 when user_id is missing', async () => {
    const req = makeRequest('http://localhost/api/stats')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('user_id required')
  })

  it('proxies GET to upstream API and returns stats', async () => {
    const mockStats = { total: 100, correct: 75 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockStats),
    }))

    const req = makeRequest('http://localhost/api/stats?user_id=99')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockStats)

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=99')
    expect(calledUrl).toContain('/api/stats')
  })
})
