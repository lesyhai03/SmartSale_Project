// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { inboxService } from '../../services/inboxService'
import { InventoryApiError, inventoryService } from '../inventory/service'
import { operationsService } from '../operations/service'
import { marketIntelligenceService } from '../market-intelligence/service'

vi.mock('../../services/inboxService', () => ({
  APP_MODE: 'live',
  inboxService: { load: vi.fn() },
}))
vi.mock('../operations/service', () => ({ operationsService: { load: vi.fn() } }))
vi.mock('../inventory/service', async (importOriginal) => {
  const original = await importOriginal<typeof import('../inventory/service')>()
  return {
    ...original,
    inventoryService: {
      ...original.inventoryService,
      load: vi.fn(),
      checkSession: vi.fn(),
    },
  }
})

const session = {
  actor: { userId: 'owner-a', tenantId: 'tenant-a', role: 'owner' },
  user: { id: 'owner-a', name: 'Owner', email: 'owner@example.com', role: 'owner' },
  tenant: { id: 'tenant-a', name: 'Company' },
  permissions: ['operations.read', 'inbox.read', 'sku.create'],
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Retained module routes', () => {
  it.each([
    [
      '/reports',
      'Báo cáo',
      'Hiện dùng được',
      'Quyền xem theo nguồn và giới hạn khối lượng xuất báo cáo.',
    ],
  ])(
    'opens %s independently of unfinished Live adapters',
    async (path, title, available, missing) => {
      vi.mocked(inventoryService.checkSession).mockResolvedValue(session)
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      )
      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: available })).toBeInTheDocument()
      expect(screen.getByText(missing)).toBeInTheDocument()
      expect(screen.getByText('Phân hệ đầy đủ chưa triển khai')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Đăng nhập kho' })).toHaveAttribute('href', '/login')
      expect(
        within(screen.getByRole('region', { name: 'Thứ tự triển khai' })).getAllByRole('listitem'),
      ).toHaveLength(5)
      expect(inboxService.load).not.toHaveBeenCalled()
      expect(operationsService.load).not.toHaveBeenCalled()
    },
  )

  it('keeps product navigation and hides automation and login from the module menu', async () => {
    const user = userEvent.setup()
    vi.mocked(inventoryService.checkSession).mockResolvedValue(session)
    vi.spyOn(marketIntelligenceService, 'status').mockResolvedValue({
      ready: false,
      providers: {
        search: { name: 'SerpAPI', configured: false },
        analysis: { name: 'Google Gemini', configured: false, model: 'gemini-2.5-flash' },
      },
    })
    vi.spyOn(marketIntelligenceService, 'listRuns').mockResolvedValue([])
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <App />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { level: 1, name: 'Báo cáo' })
    await user.click(screen.getByRole('button', { name: 'Mở điều hướng' }))
    const navigation = within(screen.getByRole('navigation', { name: 'Các phân hệ vận hành' }))
    expect(navigation.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    expect(navigation.queryByRole('link', { name: 'Tự động hóa' })).not.toBeInTheDocument()
    expect(navigation.getByRole('link', { name: 'Báo cáo' })).toHaveAttribute('href', '/reports')
    await user.click(navigation.getByRole('link', { name: 'Phân tích thị trường' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Phân tích thị trường bằng AI' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Trạng thái dịch vụ AI' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phân tích thị trường' })).toBeDisabled()
    const adminNavigation = within(
      screen.getByRole('navigation', { name: 'Điều hướng chính' }),
    )
    expect(
      adminNavigation.getByRole('link', { name: 'Phân tích thị trường' }),
    ).toHaveAttribute('href', '/market-intelligence')
    expect(
      screen.queryByRole('navigation', { name: 'Các phân hệ vận hành' }),
    ).not.toBeInTheDocument()
    expect(inboxService.load).not.toHaveBeenCalled()
    expect(operationsService.load).not.toHaveBeenCalled()
  })

  it('opens the product catalog from the left navigation', async () => {
    vi.mocked(inventoryService.checkSession)
      .mockResolvedValueOnce(session)
      .mockRejectedValueOnce(new InventoryApiError(401, 'UNAUTHENTICATED', 'Cần đăng nhập'))
    vi.mocked(inventoryService.load).mockRejectedValue(
      new InventoryApiError(401, 'UNAUTHENTICATED', 'Cần đăng nhập'),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { level: 1, name: 'Báo cáo' })
    const sidebar = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }))
    expect(sidebar.queryByRole('button', { name: 'Tự động hóa' })).not.toBeInTheDocument()
    expect(sidebar.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    await user.click(sidebar.getByRole('button', { name: 'Sản phẩm & kho' }))
    await user.click(sidebar.getByRole('button', { name: 'Sản phẩm' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sản phẩm' })).toBeInTheDocument()
    expect(inboxService.load).not.toHaveBeenCalled()
    expect(operationsService.load).not.toHaveBeenCalled()
  })
})
