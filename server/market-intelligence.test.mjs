import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError, openDatabase } from './database.mjs'
import { createMarketIntelligence } from './market-intelligence.mjs'

const createdAt = '2026-11-18T12:00:00.000Z'
const admin = { userId: 'owner-a', tenantId: 'tenant-a', role: 'owner' }
const topic = {
  industry: 'Nhà thông minh',
  market: 'Việt Nam',
  question: 'Phân tích xu hướng và đối thủ',
}
const searchResults = {
  organic_results: [
    {
      title: 'Xu hướng nhà thông minh tại Việt Nam',
      source: 'Example Research',
      link: 'https://example.com/smart-home',
      date: '2026-10-10',
      snippet: 'Người dùng quan tâm tới thiết bị tiết kiệm năng lượng.',
    },
  ],
}
const analysis = {
  summary: { text: 'Nhu cầu tiết kiệm năng lượng được đề cập.', sourceIds: ['S1'] },
  insights: [
    {
      title: 'Tiết kiệm năng lượng',
      detail: 'Nguồn ghi nhận người dùng quan tâm tới thiết bị tiết kiệm năng lượng.',
      kind: 'evidence',
      sourceIds: ['S1'],
    },
  ],
  recommendations: [
    {
      action: 'Kiểm chứng mức quan tâm trước khi mở rộng danh mục.',
      reason: 'Nguồn tìm kiếm chưa đủ để ước tính quy mô thị trường.',
      sourceIds: ['S1'],
    },
  ],
  limitations: ['Chưa có dữ liệu quy mô hoặc doanh số toàn thị trường.'],
}

describe('market intelligence service', () => {
  let db
  let fetchImpl
  let service

  beforeEach(() => {
    db = openDatabase()
    db.prepare('INSERT INTO tenants(id,name,created_at) VALUES(?,?,?)').run(
      'tenant-a',
      'Tenant A',
      createdAt,
    )
    db.prepare('INSERT INTO tenants(id,name,created_at) VALUES(?,?,?)').run(
      'tenant-b',
      'Tenant B',
      createdAt,
    )
    db.prepare('INSERT INTO users(id,tenant_id,name,role,active) VALUES(?,?,?,?,1)').run(
      'owner-a',
      'tenant-a',
      'Owner A',
      'owner',
    )
    db.prepare('INSERT INTO users(id,tenant_id,name,role,active) VALUES(?,?,?,?,1)').run(
      'owner-b',
      'tenant-b',
      'Owner B',
      'owner',
    )
    fetchImpl = vi.fn(async (url) =>
      String(url).includes('serpapi')
        ? Response.json(searchResults)
        : Response.json({
            candidates: [{ content: { parts: [{ text: JSON.stringify(analysis) }] } }],
          }),
    )
    service = createMarketIntelligence(db, {
      fetchImpl,
      serpApiKey: 'server-only-search-key',
      geminiApiKey: 'server-only-ai-key',
      now: () => new Date(createdAt),
    })
  })

  afterEach(() => {
    db.close()
    vi.restoreAllMocks()
  })

  it('runs grounded research, persists evidence, and scopes history to the tenant', async () => {
    const result = await service.research(admin, topic, 'market-run-key-001')

    expect(result.reused).toBe(false)
    expect(result.run).toMatchObject({
      industry: topic.industry,
      market: topic.market,
      question: topic.question,
      status: 'completed',
      sources: [{ id: 'S1', url: 'https://example.com/smart-home' }],
      analysis,
    })
    expect(service.listRuns({ ...admin, tenantId: 'tenant-b', userId: 'owner-b' }).runs).toEqual([])
    expect(service.listRuns(admin).runs).toHaveLength(1)
    expect(service.status(admin)).toEqual({
      ready: true,
      providers: {
        search: { name: 'SerpAPI', configured: true },
        analysis: { name: 'Google Gemini', configured: true, model: 'gemini-2.5-flash' },
      },
    })
    expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get('api_key')).toBe(
      'server-only-search-key',
    )
    expect(
      JSON.stringify({ result, status: service.status(admin), runs: service.listRuns(admin) }),
    ).not.toContain('server-only-search-key')
    expect(fetchImpl.mock.calls[1][1].headers['x-goog-api-key']).toBe('server-only-ai-key')
  })

  it('reuses an idempotent result and rejects a different payload for the same key', async () => {
    const first = await service.research(admin, topic, 'market-run-key-002')
    const repeated = await service.research(admin, topic, 'market-run-key-002')

    expect(repeated).toMatchObject({ reused: true, run: { id: first.run.id } })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    await expect(
      service.research(
        admin,
        { ...topic, question: 'Khác nội dung nghiên cứu' },
        'market-run-key-002',
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
  })

  it('refuses non-admin access and reports missing provider configuration', async () => {
    expect(() => service.status({ ...admin, role: 'staff' })).toThrow(DomainError)
    const unconfigured = createMarketIntelligence(db, {
      fetchImpl,
      serpApiKey: '',
      geminiApiKey: '',
    })
    expect(unconfigured.status(admin).ready).toBe(false)
    await expect(unconfigured.research(admin, topic, 'market-run-key-003')).rejects.toMatchObject({
      code: 'MARKET_PROVIDER_NOT_CONFIGURED',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('does not publish an analysis that cites a source outside the evidence set', async () => {
    fetchImpl.mockImplementation(async (url) =>
      String(url).includes('serpapi')
        ? Response.json(searchResults)
        : Response.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        ...analysis,
                        summary: { text: 'Không có nguồn hợp lệ.', sourceIds: ['S99'] },
                      }),
                    },
                  ],
                },
              },
            ],
          }),
    )

    await expect(service.research(admin, topic, 'market-run-key-004')).rejects.toMatchObject({
      code: 'MARKET_ANALYSIS_INVALID',
    })
    const [saved] = service.listRuns(admin).runs
    expect(saved).toMatchObject({ status: 'failed', errorCode: 'MARKET_ANALYSIS_INVALID' })
    expect(saved.analysis).toBeNull()
  })
})
