// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nContext } from '../../i18n/context'
import { marketIntelligenceService } from './service'
import type { MarketResearchRun } from './service'
import MarketIntelligencePage from './MarketIntelligencePage'

vi.mock('../../services/inboxService', () => ({ APP_MODE: 'live' }))

const source = {
  id: 'S1',
  title: 'Xu hướng nhà thông minh tại Việt Nam',
  publisher: 'Example Research',
  url: 'https://example.com/market',
  publishedAt: '2026-11-01',
  excerpt: 'Người mua quan tâm tới các thiết bị tiết kiệm năng lượng.',
}

const run: MarketResearchRun = {
  id: 'run-1',
  industry: 'Nhà thông minh',
  market: 'Việt Nam',
  question: 'Phân tích xu hướng thị trường',
  status: 'completed',
  model: 'gemini-2.5-flash',
  sources: [source],
  analysis: {
    summary: { text: 'Nhu cầu trong ngành đang tăng.', sourceIds: ['S1'] },
    insights: [
      {
        title: 'Tiết kiệm năng lượng',
        detail: 'Nguồn tham khảo ghi nhận mối quan tâm về tiết kiệm năng lượng.',
        kind: 'evidence',
        sourceIds: ['S1'],
      },
    ],
    recommendations: [
      {
        action: 'Kiểm chứng nhu cầu với khách hàng mục tiêu.',
        reason: 'Nguồn công khai chưa đủ để ước tính quy mô thị trường.',
        sourceIds: ['S1'],
      },
    ],
    limitations: ['Chưa có dữ liệu doanh số toàn thị trường.'],
  },
  errorCode: null,
  createdAt: '2026-11-18T12:00:00.000Z',
  finishedAt: '2026-11-18T12:00:10.000Z',
}

const renderPage = () =>
  render(
    <I18nContext.Provider
      value={{
        locale: 'vi',
        setLocale: vi.fn(),
        t: (vi) => vi,
        label: (name) => name,
      }}
    >
      <MarketIntelligencePage />
    </I18nContext.Provider>,
  )

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('market intelligence page', () => {
  it('renders sourced findings and stores a completed research run', async () => {
    const user = userEvent.setup()
    vi.spyOn(marketIntelligenceService, 'status').mockResolvedValue({
      ready: true,
      providers: {
        search: { name: 'SerpAPI', configured: true },
        analysis: { name: 'Google Gemini', configured: true, model: 'gemini-2.5-flash' },
      },
    })
    vi.spyOn(marketIntelligenceService, 'listRuns').mockResolvedValue([])
    const research = vi.spyOn(marketIntelligenceService, 'research').mockResolvedValue({
      run,
      reused: false,
    })

    renderPage()
    await screen.findAllByText('Đã cấu hình')
    await user.click(screen.getByRole('button', { name: 'Phân tích thị trường' }))

    const summary = await screen.findByRole('region', { name: 'Tổng kết điều hành' })
    expect(within(summary).getByText('Nhu cầu trong ngành đang tăng.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Nhà thông minh · Việt Nam' })).toHaveFocus()
    expect(screen.getByText('Tiết kiệm năng lượng')).toBeInTheDocument()
    expect(screen.getByText('Giới hạn dữ liệu')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: source.title })).toHaveAttribute('href', source.url)
    expect(research).toHaveBeenCalledWith(
      expect.objectContaining({ industry: 'Nhà thông minh', market: 'Việt Nam' }),
    )
  })

  it('keeps research disabled until both providers are configured', async () => {
    vi.spyOn(marketIntelligenceService, 'status').mockResolvedValue({
      ready: false,
      providers: {
        search: { name: 'SerpAPI', configured: false },
        analysis: { name: 'Google Gemini', configured: false, model: 'gemini-2.5-flash' },
      },
    })
    vi.spyOn(marketIntelligenceService, 'listRuns').mockResolvedValue([])

    renderPage()

    expect(await screen.findAllByText('Chưa cấu hình')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Phân tích thị trường' })).toBeDisabled()
  })
})
