export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 [&>*]:flex-1 [&>*]:justify-center sm:[&>*]:flex-none">{action}</div>}
    </div>
  )
}
