import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../src/app/api/due-cards/route'
import { NextRequest } from 'next/server'

function makeRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

describe('GET /api/due-cards', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 400 when user_id is missing', async () => {
    const req = makeRequest('http://localhost/api/due-cards')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('user_id required')
  })

  it('proxies GET to upstream API and returns cards', async () => {
    const mockCards = [{ id: 1, word: 'hello' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockCards),
    }))

    const req = makeRequest('http://localhost/api/due-cards?user_id=7')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockCards)

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('user_id=7')
    expect(calledUrl).toContain('limit=20')
  })
})
