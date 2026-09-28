const LINES = ['Identity secured', 'Trust assured']

export default function Slogan({ animated = false, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] ${className}`}>
      <span className="h-px w-8 mb-1 bg-current opacity-40" />
      {LINES.map((line, i) =>
        animated ? (
          <span key={line} className="animate-rise-in" style={{ animationDelay: `${i * 0.25}s` }}>
            <span className="block bg-gradient-to-r from-brand-900 via-brand-400 to-brand-900 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
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
