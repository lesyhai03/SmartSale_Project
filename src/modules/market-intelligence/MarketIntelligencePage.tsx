import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '../../i18n'
import { APP_MODE } from '../../services/inboxService'
import { ModulePageHeader } from '../operations/ui'
import { marketIntelligenceService } from './service'
import type { MarketProviderStatus, MarketResearchRun, MarketResearchSource } from './service'
import './market-intelligence.css'

const initialQuestion =
  'Phân tích xu hướng nhu cầu, nhóm sản phẩm nổi bật, đối thủ và cơ hội trong 12 tháng gần đây. Dẫn nguồn và nêu rõ nội dung chưa kiểm chứng.'

const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

function SourceReferences({ ids, sources }: { ids: string[]; sources: MarketResearchSource[] }) {
  const { t } = useI18n()
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const references = ids
    .map((id) => sourceById.get(id))
    .filter((source): source is MarketResearchSource => Boolean(source))
  if (!references.length) return null
  return (
    <div className="market-source-references" aria-label={t('Nguồn tham khảo', 'References')}>
      {references.map((source) => (
        <a key={source.id} href={source.url} target="_blank" rel="noreferrer" title={source.title}>
          {source.id} <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}

function SourceCard({ source }: { source: MarketResearchSource }) {
  const { t } = useI18n()
  return (
    <article className="market-source">
      <div className="market-source-heading">
        <span>{source.id}</span>
        <a href={source.url} target="_blank" rel="noreferrer">
          {t('Mở nguồn', 'Open source')} <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
      <h3>
        <a href={source.url} target="_blank" rel="noreferrer">
          {source.title}
        </a>
      </h3>
      <p className="market-source-meta">
        {[source.publisher, source.publishedAt].filter(Boolean).join(' · ') ||
          t('Ngày xuất bản chưa rõ', 'Publication date unavailable')}
      </p>
      {source.excerpt && <p className="market-source-excerpt">{source.excerpt}</p>}
    </article>
  )
}

export default function MarketIntelligencePage() {
  const { t, locale } = useI18n()
  const [status, setStatus] = useState<MarketProviderStatus | null>(null)
  const [runs, setRuns] = useState<MarketResearchRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState('')
  const [industry, setIndustry] = useState('Nhà thông minh')
  const [market, setMarket] = useState('Việt Nam')
  const [question, setQuestion] = useState(initialQuestion)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [reportToReveal, setReportToReveal] = useState('')
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const reportRef = useRef<HTMLElement>(null)

  const loadPage = useCallback(async () => {
    if (APP_MODE !== 'live') {
      setLoading(false)
      setError(
        t(
          'Phân tích thị trường cần chế độ Live và phiên đăng nhập quản trị.',
          'Market analysis requires Live mode and an administrator session.',
        ),
      )
      return
    }
    setLoading(true)
    setError('')
    try {
      const [providerStatus, history] = await Promise.all([
        marketIntelligenceService.status(),
        marketIntelligenceService.listRuns(),
      ])
      setStatus(providerStatus)
      setRuns(history)
      setSelectedRunId((selected) => selected || history[0]?.id || '')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t('Không tải được phân tích thị trường.', 'Unable to load market analysis.'),
      )
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  )

  useEffect(() => {
    if (!reportToReveal || selectedRun?.id !== reportToReveal) return
    const report = reportRef.current
    if (!report) return
    if (typeof report.scrollIntoView === 'function')
      report.scrollIntoView({ behavior: 'smooth', block: 'start' })
    report.focus({ preventScroll: true })
    setReportToReveal('')
  }, [reportToReveal, selectedRun])

  const runResearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (running || !status?.ready) return
    setRunning(true)
    setError('')
    setHistoryError('')
    try {
      const result = await marketIntelligenceService.research({
        industry: industry.trim(),
        market: market.trim(),
        question: question.trim(),
      })
      setRuns((current) =>
        [result.run, ...current.filter((run) => run.id !== result.run.id)].slice(0, 20),
      )
      setSelectedRunId(result.run.id)
      setReportToReveal(result.run.id)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t('Không thể hoàn tất phân tích.', 'Unable to complete analysis.'),
      )
      try {
        const history = await marketIntelligenceService.listRuns()
        setRuns(history)
        setSelectedRunId((selected) => selected || history[0]?.id || '')
      } catch (historyCause) {
        setHistoryError(
          historyCause instanceof Error
            ? historyCause.message
            : t('Không tải được lịch sử nghiên cứu.', 'Unable to load research history.'),
        )
      }
    } finally {
      setRunning(false)
    }
  }

  const providerState = (configured: boolean) => (
    <span className={`market-provider-state ${configured ? 'is-ready' : 'is-missing'}`}>
      {configured ? (
        <CheckCircle2 size={14} aria-hidden="true" />
      ) : (
        <AlertTriangle size={14} aria-hidden="true" />
      )}
      {configured ? t('Đã cấu hình', 'Configured') : t('Chưa cấu hình', 'Not configured')}
    </span>
  )

  return (
    <main className="ops-page market-page">
      <ModulePageHeader
        eyebrow="SMARTSALES / MARKET INTELLIGENCE"
        title={t('Phân tích thị trường bằng AI', 'AI market intelligence')}
        description={t(
          'Tìm nguồn công khai bằng SerpAPI và dùng Gemini tổng hợp nhận định có dẫn chứng.',
          'Search public sources with SerpAPI and use Gemini to produce cited findings.',
        )}
      />

      {error && (
        <div className="market-alert" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="market-loading" role="status">
          <LoaderCircle size={19} className="spin" aria-hidden="true" />
          {t('Đang tải trạng thái dịch vụ…', 'Loading provider status…')}
        </div>
      ) : (
        <>
          {status && (
            <section className={`market-provider-panel ${status.ready ? 'is-ready' : ''}`}>
              <div className="market-provider-title">
                <span className="market-icon">
                  <ShieldCheck size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2>{t('Trạng thái dịch vụ AI', 'AI provider status')}</h2>
                  <p>
                    {status.ready
                      ? t(
                          'Nhà cung cấp đã sẵn sàng. Báo cáo chỉ chạy khi bạn gửi yêu cầu.',
                          'Providers are ready. Research runs only when you submit a request.',
                        )
                      : t(
                          'Thiếu cấu hình máy chủ. Thêm khóa vào .env rồi khởi động lại API.',
                          'Server configuration is missing. Add the keys to .env and restart the API.',
                        )}
                  </p>
                </div>
              </div>
              <div className="market-provider-list">
                <div>
                  <span>{t('Tìm kiếm web', 'Web search')}</span>
                  <strong>{status.providers.search.name}</strong>
                  {providerState(status.providers.search.configured)}
                </div>
                <div>
                  <span>{t('Phân tích', 'Analysis')}</span>
                  <strong>
                    {status.providers.analysis.name} · {status.providers.analysis.model}
                  </strong>
                  {providerState(status.providers.analysis.configured)}
                </div>
              </div>
              {!status.ready && (
                <p className="market-env-hint">
                  <code>SERPAPI_API_KEY</code>
                  <code>GEMINI_API_KEY</code>
                </p>
              )}
            </section>
          )}

          <div className="market-content-grid">
            <section className="market-card market-research-card">
              <div className="market-card-heading">
                <span className="market-icon">
                  <Search size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2>{t('Tạo nghiên cứu mới', 'Start new research')}</h2>
                  <p>
                    {t(
                      'Chọn ngành, thị trường và câu hỏi cần trả lời.',
                      'Choose the industry, market, and research question.',
                    )}
                  </p>
                </div>
              </div>
              <form className="market-research-form" onSubmit={(event) => void runResearch(event)}>
                <div className="market-field-row">
                  <label>
                    {t('Ngành hàng', 'Industry')}
                    <input
                      value={industry}
                      maxLength={120}
                      minLength={2}
                      required
                      onChange={(event) => setIndustry(event.target.value)}
                    />
                  </label>
                  <label>
                    {t('Thị trường / khu vực', 'Market / region')}
                    <input
                      value={market}
                      maxLength={120}
                      minLength={2}
                      required
                      onChange={(event) => setMarket(event.target.value)}
                    />
                  </label>
                </div>
                <label>
                  {t('Câu hỏi nghiên cứu', 'Research question')}
                  <textarea
                    value={question}
                    rows={4}
                    minLength={8}
                    maxLength={600}
                    required
                    onChange={(event) => setQuestion(event.target.value)}
                  />
                </label>
                <div className="market-privacy-note">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>
                    {t(
                      'Chỉ gửi câu hỏi và trích đoạn nguồn công khai tới AI. Không nhập dữ liệu khách hàng hoặc bí mật doanh nghiệp.',
                      'Only the question and public-source excerpts are sent to AI. Do not enter customer data or business secrets.',
                    )}
                  </span>
                </div>
                <button
                  type="submit"
                  className="button button-primary market-submit"
                  disabled={!status?.ready || running}
                >
                  {running ? (
                    <LoaderCircle size={16} className="spin" aria-hidden="true" />
                  ) : (
                    <Sparkles size={16} aria-hidden="true" />
                  )}
                  {running
                    ? t('Đang tìm nguồn và phân tích…', 'Searching and analyzing…')
                    : t('Phân tích thị trường', 'Analyze market')}
                </button>
              </form>
            </section>

            <section className="market-card market-history-card">
              <div className="market-card-heading">
                <span className="market-icon">
                  <Clock3 size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2>{t('Lịch sử nghiên cứu', 'Research history')}</h2>
                  <p>
                    {t(
                      'Tối đa 20 lần nghiên cứu gần nhất của doanh nghiệp.',
                      'The 20 most recent runs for this business.',
                    )}
                  </p>
                </div>
              </div>
              {historyError && (
                <p className="market-history-error" role="alert">
                  {historyError}
                </p>
              )}
              {runs.length ? (
                <ul className="market-history-list">
                  {runs.map((run) => (
                    <li key={run.id}>
                      <button
                        type="button"
                        className={run.id === selectedRun?.id ? 'is-selected' : ''}
                        aria-current={run.id === selectedRun?.id ? 'true' : undefined}
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <span className={`market-run-dot status-${run.status}`} />
                        <span className="market-history-copy">
                          <strong>
                            {run.industry} · {run.market}
                          </strong>
                          <small>{run.question}</small>
                          <small>{formatDate(run.createdAt, locale)}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="market-empty">
                  <Globe2 size={24} aria-hidden="true" />
                  <p>{t('Chưa có nghiên cứu nào được lưu.', 'No research has been saved yet.')}</p>
                </div>
              )}
            </section>
          </div>

          {selectedRun && (
            <section
              ref={reportRef}
              className="market-report"
              aria-labelledby="market-report-title"
              tabIndex={-1}
            >
              <header className="market-report-header">
                <div>
                  <span className="market-report-eyebrow">
                    <BrainCircuit size={15} aria-hidden="true" />
                    {t('BÁO CÁO NGHIÊN CỨU', 'RESEARCH REPORT')}
                  </span>
                  <h2 id="market-report-title">
                    {selectedRun.industry} · {selectedRun.market}
                  </h2>
                  <p>{selectedRun.question}</p>
                </div>
                <div className={`market-report-status status-${selectedRun.status}`}>
                  {selectedRun.status === 'completed'
                    ? t('Hoàn tất', 'Completed')
                    : selectedRun.status === 'running'
                      ? t('Đang chạy', 'Running')
                      : t('Không hoàn tất', 'Failed')}
                </div>
              </header>
              {selectedRun.status === 'failed' && (
                <div className="market-alert" role="status">
                  <AlertTriangle size={17} aria-hidden="true" />
                  <p>
                    {selectedRun.errorCode === 'MARKET_NO_SOURCES'
                      ? t(
                          'Không tìm thấy nguồn phù hợp. Hãy thử câu hỏi hoặc khu vực khác.',
                          'No suitable sources were found. Try a different question or region.',
                        )
                      : t(
                          'Lần nghiên cứu này không hoàn tất. Hãy kiểm tra cấu hình và thử lại.',
                          'This research run did not complete. Check configuration and try again.',
                        )}
                  </p>
                </div>
              )}
              {selectedRun.analysis && (
                <>
                  <section className="market-summary" aria-labelledby="market-summary-title">
                    <CheckCircle2 size={21} aria-hidden="true" />
                    <div>
                      <h3 id="market-summary-title">
                        {t('Tổng kết điều hành', 'Executive summary')}
                      </h3>
                      <p>{selectedRun.analysis.summary.text}</p>
                      <SourceReferences
                        ids={selectedRun.analysis.summary.sourceIds}
                        sources={selectedRun.sources}
                      />
                    </div>
                  </section>
                  <div className="market-report-grid">
                    <section className="market-report-section">
                      <h3>{t('Nhận định', 'Findings')}</h3>
                      <div className="market-insights">
                        {selectedRun.analysis.insights.map((insight, index) => (
                          <article className="market-insight" key={`${insight.title}-${index}`}>
                            <div className="market-insight-heading">
                              <span className={`market-evidence-tag ${insight.kind}`}>
                                {insight.kind === 'evidence'
                                  ? t('Có nguồn dẫn', 'Source-backed')
                                  : t('Suy luận AI', 'AI inference')}
                              </span>
                              <SourceReferences
                                ids={insight.sourceIds}
                                sources={selectedRun.sources}
                              />
                            </div>
                            <h4>{insight.title}</h4>
                            <p>{insight.detail}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className="market-report-section">
                      <h3>{t('Đề xuất hành động', 'Recommended actions')}</h3>
                      <div className="market-insights">
                        {selectedRun.analysis.recommendations.map((item, index) => (
                          <article className="market-insight" key={`${item.action}-${index}`}>
                            <div className="market-insight-heading">
                              <span className="market-evidence-tag recommendation">
                                {t('Đề xuất', 'Recommendation')}
                              </span>
                              <SourceReferences
                                ids={item.sourceIds}
                                sources={selectedRun.sources}
                              />
                            </div>
                            <h4>{item.action}</h4>
                            <p>{item.reason}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                  {selectedRun.analysis.limitations.length > 0 && (
                    <div className="market-limitations">
                      <AlertTriangle size={16} aria-hidden="true" />
                      <div>
                        <strong>{t('Giới hạn dữ liệu', 'Data limitations')}</strong>
                        <ul>
                          {selectedRun.analysis.limitations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedRun.sources.length > 0 && (
                <section className="market-sources-section">
                  <h3>
                    <Globe2 size={17} aria-hidden="true" />
                    {t('Nguồn tham khảo', 'Sources')} ({selectedRun.sources.length})
                  </h3>
                  <div className="market-sources-grid">
                    {selectedRun.sources.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </div>
                  <p className="market-source-disclaimer">
                    {t(
                      'Kết quả tìm kiếm là trích đoạn công khai, không đảm bảo đầy đủ hoặc độc lập. Hãy mở nguồn và tự xác minh trước khi ra quyết định.',
                      'Search results are public excerpts and may be incomplete or non-independent. Open and verify sources before making decisions.',
                    )}
                  </p>
                </section>
              )}
              <p className="market-report-meta">
                {t('Mô hình', 'Model')}: {selectedRun.model} ·{' '}
                {formatDate(selectedRun.createdAt, locale)}
              </p>
            </section>
          )}
        </>
      )}
    </main>
  )
}
