export default function SegmentedControl({ options, value, onChange, className = '' }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div
      role="tablist"
      className={`relative grid p-1 bg-gray-100 rounded-lg ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-md bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 ease-ios motion-reduce:transition-none"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(optionValue)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-[color,transform] duration-300 ease-ios active:scale-95 ${
              selected ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {Icon && <Icon size={13} />} {label}
          </button>
        )
      })}
    </div>
  )
}
