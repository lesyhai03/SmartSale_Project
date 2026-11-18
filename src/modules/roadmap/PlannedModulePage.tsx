import { ArrowRight, CheckCircle2, CircleDashed, Clock3, FileText, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { ModulePageHeader } from '../operations/ui'
import './roadmap.css'

type Module = 'products' | 'reports'

export default function PlannedModulePage({ module }: { module: Module }) {
  const { t } = useI18n()
  const content = {
    products: {
      title: t('Sản phẩm', 'Products'),
      stage: 3,
      description: t(
        'Danh mục SKU đang phục vụ kho và báo giá. Phân hệ sản phẩm đầy đủ sẽ triển khai sau phân tích thị trường.',
        'The SKU catalog supports inventory and quotations. The full product module follows market intelligence.',
      ),
      available: [
        t(
          'Tạo và sửa SKU, nhóm hàng, đơn vị, giá bán và thời hạn bảo hành trong kho.',
          'Create and edit SKUs, categories, units, selling prices and warranty periods in inventory.',
        ),
        t(
          'Bổ sung ảnh, mô tả, thông số và đường dẫn nguồn cho báo giá PDF.',
          'Add images, descriptions, specifications and source links for PDF quotations.',
        ),
        t(
          'Giá chưa nhập được ghi rõ, cần bổ sung trước khi chọn vào báo giá.',
          'Missing prices are identified and must be entered before an item can be quoted.',
        ),
      ],
      missing: [
        t(
          'Nhóm thuộc tính theo ngành, kiểu dữ liệu và quy tắc kiểm tra.',
          'Industry attribute groups, data types and validation rules.',
        ),
        t(
          'Quản lý biến thể, phiên bản danh mục và chuyển dữ liệu có đối soát.',
          'Variants, catalog versions and reconciled data migration.',
        ),
        t(
          'Danh mục Lumi với model, thông số và giá có nguồn xác minh.',
          'A Lumi catalog with verified sources for models, specifications and prices.',
        ),
      ],
      gate: t(
        'Triển khai sau khi nghiệm thu kho và hoàn thành phân tích thị trường.',
        'Implementation follows inventory acceptance and completion of market intelligence.',
      ),
    },
    reports: {
      title: t('Báo cáo', 'Reports'),
      stage: 4,
      description: t(
        'Các chỉ số kho đã hoạt động; bộ tạo báo cáo tùy chỉnh chưa triển khai và sẽ theo sau phân hệ sản phẩm.',
        'Inventory metrics are running; the custom report builder is planned after the product module.',
      ),
      available: [
        t(
          'Xem tồn kho, giá trị tồn và chỉ số nhập/xuất từ dữ liệu kho.',
          'View stock, inventory value and receipt/issue metrics from inventory records.',
        ),
        t(
          'Tổng quan bán hàng có chỉ số từ dữ liệu Demo hoặc API đã cấu hình.',
          'The sales dashboard uses Demo data or a configured API.',
        ),
      ],
      missing: [
        t(
          'Chọn nguồn dữ liệu, trường hiển thị, nhóm và bộ lọc để tạo báo cáo.',
          'Choose data sources, fields, grouping and filters to build reports.',
        ),
        t(
          'Quyền xem theo nguồn và giới hạn khối lượng xuất báo cáo.',
          'Source access permissions and report export limits.',
        ),
        t(
          'Lưu mẫu, tổng hợp liên phân hệ và xuất báo cáo có đối soát.',
          'Save templates, aggregate across modules and export reconciled reports.',
        ),
      ],
      gate: t(
        'Triển khai sau phân tích thị trường và sản phẩm; báo giá PDF hiện là chứng từ riêng.',
        'Implement after market intelligence and products; PDF quotations are a separate document flow.',
      ),
    },
  }[module]
  const stages = [
    {
      title: t('Kho', 'Inventory'),
      path: '/inventory',
      status: t('Đã chạy · chờ nghiệm thu', 'Running · awaiting acceptance'),
    },
    {
      title: t('Phân tích thị trường', 'Market intelligence'),
      path: '/market-intelligence',
      status: t('Đã có bản đầu · cần cấu hình API', 'Initial version · API setup required'),
    },
    {
      title: t('Sản phẩm', 'Products'),
      path: '/products',
      status: t('Có nền SKU · chưa đủ phân hệ', 'SKU foundation · module incomplete'),
    },
    {
      title: t('Báo cáo', 'Reports'),
      path: '/reports',
      status: t('Có chỉ số · chưa có bộ tạo báo cáo', 'Metrics available · builder pending'),
    },
    {
      title: t('Tích hợp toàn hệ thống', 'System integration'),
      path: null,
      status: t('Chưa bắt đầu', 'Not started'),
    },
  ]
  return (
    <main className="ops-page roadmap-page">
      <ModulePageHeader
        eyebrow={`SMARTSALES / ${t('GIAI ĐOẠN', 'STAGE')} ${content.stage}`}
        title={content.title}
        description={content.description}
        action={
          <Link className="button button-primary" to="/inventory">
            <Warehouse size={16} />
            {t('Mở kho và báo giá', 'Open inventory and quotations')}
          </Link>
        }
      />
      <div className="roadmap-summary">
        <Clock3 size={21} aria-hidden="true" />
        <div>
          <strong>
            {t('Phân hệ đầy đủ chưa triển khai', 'Full module awaiting implementation')}
          </strong>
          <p>{content.gate}</p>
        </div>
      </div>
      <div className="roadmap-columns">
        <section className="roadmap-card">
          <h2>
            <CheckCircle2 size={18} />
            {t('Hiện dùng được', 'Available now')}
          </h2>
          <ul>
            {content.available.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link to="/inventory">
            {t('Xem chức năng đang chạy', 'View available functions')}
            <ArrowRight size={15} />
          </Link>
        </section>
        <section className="roadmap-card roadmap-pending">
          <h2>
            <CircleDashed size={18} />
            {t('Còn thiếu', 'Remaining work')}
          </h2>
          <ul>
            {content.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <section
        className="roadmap-sequence"
        aria-label={t('Thứ tự triển khai', 'Implementation order')}
      >
        <div className="roadmap-section-heading">
          <div>
            <h2>{t('Thứ tự triển khai', 'Implementation order')}</h2>
            <p>
              {t(
                'Hoàn thiện và nghiệm thu từng giai đoạn trước khi chuyển tiếp.',
                'Complete and accept each stage before moving forward.',
              )}
            </p>
          </div>
          <FileText size={20} aria-hidden="true" />
        </div>
        <ol>
          {stages.map((stage, index) => (
            <li key={stage.title} aria-current={content.stage === index + 1 ? 'step' : undefined}>
              <span className="roadmap-step">{index + 1}</span>
              <div>
                {stage.path ? (
                  <Link to={stage.path}>{stage.title}</Link>
                ) : (
                  <strong>{stage.title}</strong>
                )}
                <p>{stage.status}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <div className="roadmap-access">
        <CheckCircle2 size={17} />
        <p>
          {t(
            'Kho hỗ trợ tài khoản doanh nghiệp và tài khoản nhân viên theo vai trò.',
            'Inventory supports business and employee accounts with role-based access.',
          )}
        </p>
        <Link to="/login">
          {t('Đăng nhập kho', 'Sign in to inventory')}
          <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  )
}
