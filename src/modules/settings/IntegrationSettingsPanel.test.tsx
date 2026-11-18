// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nContext } from '../../i18n/context'
import { AppAccessContext, DEMO_ACCESS } from '../operations/access'
import { inboxService } from '../../services/inboxService'
import { integrationSettingsService } from './service'
import IntegrationSettingsPanel from './IntegrationSettingsPanel'

vi.mock('../../services/inboxService', () => ({
  APP_MODE: 'live',
  inboxService: { listConnections: vi.fn() },
}))
vi.mock('./service', () => ({
  integrationSettingsService: {
    status: vi.fn(),
    test: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  },
}))

const renderPanel = (access = DEMO_ACCESS) =>
  render(
    <MemoryRouter>
      <I18nContext.Provider
        value={{
          locale: 'en',
          setLocale: vi.fn(),
          t: (_vi, en) => en,
          label: (name) => name,
        }}
      >
        <AppAccessContext.Provider value={access}>
          <IntegrationSettingsPanel />
        </AppAccessContext.Provider>
      </I18nContext.Provider>
    </MemoryRouter>,
  )

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Integration settings', () => {
  it('shows provider status, live Telegram connection, unsupported channels, and safe key guidance', async () => {
    vi.mocked(integrationSettingsService.status).mockResolvedValue({
      canSaveCredentials: true,
      encryptionKeyConfigured: true,
      providers: {
        gemini: { configured: true, source: 'server', model: 'gemini-2.5-flash' },
        serpapi: { configured: true, source: 'server' },
        telegram: { configured: true, source: 'workspace' },
        shopee: { configured: false, source: 'server' },
        lazada: { configured: false, source: 'server' },
        tiktokshop: { configured: false, source: 'server' },
      },
    })
    vi.mocked(inboxService.listConnections).mockResolvedValue([
      {
        id: 'telegram-a',
        channel: 'telegram',
        accountName: '@StoreBot',
        status: 'connected',
        lastSyncedAt: null,
        detail: 'Manual sync',
      },
    ])

    renderPanel()

    expect(await screen.findByText('@StoreBot')).toBeInTheDocument()
    expect(screen.getAllByText('Configured')).toHaveLength(2)
    expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument()
    expect(screen.getAllByText('Connector not implemented').length).toBeGreaterThan(0)
    expect(screen.getByText('GEMINI_API_KEY')).toBeInTheDocument()
    expect(screen.getByText(/never revealed or stored in the browser/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open AI analysis/ })).toHaveAttribute(
      'href',
      '/market-intelligence',
    )
  })

  it('tests and saves a Gemini key without leaving it visible in the form', async () => {
    const user = userEvent.setup()
    const status = {
      canSaveCredentials: true,
      encryptionKeyConfigured: true,
      providers: {
        gemini: { configured: true, source: 'workspace' as const, model: 'gemini-2.5-flash' },
        serpapi: { configured: false, source: 'server' as const },
        telegram: { configured: false, source: 'server' as const },
        shopee: { configured: false, source: 'server' as const },
        lazada: { configured: false, source: 'server' as const },
        tiktokshop: { configured: false, source: 'server' as const },
      },
    }
    vi.mocked(integrationSettingsService.status).mockResolvedValue(status)
    vi.mocked(integrationSettingsService.test).mockResolvedValue({
      accountName: 'Google Gemini',
    })
    vi.mocked(integrationSettingsService.save).mockResolvedValue({
      accountName: 'Google Gemini',
      status,
    })
    vi.mocked(inboxService.listConnections).mockResolvedValue([])

    renderPanel()
    const keyInput = await screen.findByLabelText('Gemini API key')
    await user.type(keyInput, 'test-gemini-secret-key')
    const testButtons = screen.getAllByRole('button', { name: 'Test connection' })
    await user.click(testButtons[0])

    expect(integrationSettingsService.test).toHaveBeenCalledWith('gemini', {
      apiKey: 'test-gemini-secret-key',
      model: 'gemini-2.5-flash',
    })

    await user.click(screen.getAllByRole('button', { name: 'Save configuration' })[0])
    expect(integrationSettingsService.save).toHaveBeenCalledWith('gemini', {
      apiKey: 'test-gemini-secret-key',
      model: 'gemini-2.5-flash',
    })
    expect(keyInput).toHaveValue('')
  })

  it('tests and saves seller API credentials for a marketplace', async () => {
    const user = userEvent.setup()
    const status = {
      canSaveCredentials: true,
      encryptionKeyConfigured: true,
      providers: {
        gemini: { configured: false, source: 'server' as const, model: 'gemini-2.5-flash' },
        serpapi: { configured: false, source: 'server' as const },
        telegram: { configured: false, source: 'server' as const },
        shopee: { configured: true, source: 'workspace' as const, accountName: 'Smart Store' },
        lazada: { configured: false, source: 'server' as const },
        tiktokshop: { configured: false, source: 'server' as const },
      },
    }
    vi.mocked(integrationSettingsService.status).mockResolvedValue(status)
    vi.mocked(integrationSettingsService.test).mockResolvedValue({ accountName: 'Smart Store' })
    vi.mocked(integrationSettingsService.save).mockResolvedValue({
      accountName: 'Smart Store',
      status,
    })
    vi.mocked(inboxService.listConnections).mockResolvedValue([])

    renderPanel()
    await user.type(await screen.findByLabelText('Shopee Partner ID'), '12345')
    await user.type(screen.getByLabelText('Shopee Partner Key'), 'partner-secret-value')
    await user.type(screen.getByLabelText('Shopee Shop ID'), '67890')
    await user.type(screen.getByLabelText('Shopee access token'), 'shop-access-token-value')

    await user.click(screen.getByRole('button', { name: 'Test Shopee connection' }))
    const credentials = {
      partnerId: '12345',
      partnerKey: 'partner-secret-value',
      shopId: '67890',
      accessToken: 'shop-access-token-value',
      refreshToken: '',
    }
    expect(integrationSettingsService.test).toHaveBeenCalledWith('shopee', credentials)

    await user.click(screen.getByRole('button', { name: 'Save Shopee connection' }))
    expect(integrationSettingsService.save).toHaveBeenCalledWith('shopee', credentials)
  })

  it('explains why credentials cannot be saved when server encryption is unavailable', async () => {
    const user = userEvent.setup()
    vi.mocked(integrationSettingsService.status).mockResolvedValue({
      canSaveCredentials: false,
      encryptionKeyConfigured: false,
      providers: {
        gemini: { configured: false, source: 'server', model: 'gemini-2.5-flash' },
        serpapi: { configured: false, source: 'server' },
        telegram: { configured: false, source: 'server' },
        shopee: { configured: false, source: 'server' },
        lazada: { configured: false, source: 'server' },
        tiktokshop: { configured: false, source: 'server' },
      },
    })
    vi.mocked(inboxService.listConnections).mockResolvedValue([])

    renderPanel()
    await user.type(await screen.findByLabelText('Shopee Partner ID'), '12345')
    await user.type(screen.getByLabelText('Shopee Partner Key'), 'partner-secret-value')
    await user.type(screen.getByLabelText('Shopee Shop ID'), '67890')
    await user.type(screen.getByLabelText('Shopee access token'), 'shop-access-token-value')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'INTEGRATION_ENCRYPTION_KEY is not configured',
    )
    expect(screen.getByRole('button', { name: 'Test Shopee connection' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save Shopee connection' })).toBeDisabled()
  })

  it('does not request integration details for non-admin users', async () => {
    renderPanel({ role: 'staff', permissions: ['inbox.read'] })

    expect(
      await screen.findByText('Only owners/admins can view and manage integrations.'),
    ).toBeInTheDocument()
    expect(integrationSettingsService.status).not.toHaveBeenCalled()
    expect(inboxService.listConnections).not.toHaveBeenCalled()
  })
})
