const LINES = ['Identity secured', 'Trust assured']

const SHIMMER = {
  dark: 'from-brand-900 via-brand-400 to-brand-900',
  light: 'from-white via-brand-300 to-white',
}

export default function Slogan({ animated = false, compact = false, tone = 'dark', className = '' }) {
  const layout = compact
    ? 'items-end gap-0.5 text-[8px] tracking-[0.14em] leading-tight'
    : 'items-center gap-1 text-[10px] sm:text-[11px] tracking-[0.3em]'

  return (
    <div className={`flex flex-col font-semibold uppercase ${layout} ${className}`}>
      {!compact && <span className="h-px w-8 mb-1 bg-current opacity-40" />}
      {LINES.map((line, i) =>
        animated ? (
          <span key={line} className="animate-rise-in" style={{ animationDelay: `${i * 0.25}s` }}>
            <span className={`block bg-gradient-to-r ${SHIMMER[tone]} bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer`}>
              {line}
            </span>
          </span>
        ) : (
          <span key={line} className={i ? 'opacity-70' : ''}>{line}</span>
        ),
      )}
    </div>
  )
}
