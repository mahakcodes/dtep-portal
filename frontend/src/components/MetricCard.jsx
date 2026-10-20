export default function MetricCard({ label, value, sub, accent = 'charcoal', delta }) {
  const accents = {
    charcoal: 'from-charcoal-300 to-charcoal-200',
    olive: 'from-olive-400 to-olive-300',
    terracotta: 'from-terracotta-400 to-terracotta-300',
    beige: 'from-beige-300 to-beige-200',
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-beige-100 bg-cream-50 p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-beige-200 hover:bg-white hover:shadow-soft-lg">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br opacity-[0.07] transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal-50">{label}</p>
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold ${
                delta.positive
                  ? 'bg-olive-50 text-olive-500'
                  : 'bg-terracotta-50 text-terracotta-400'
              }`}
            >
              {delta.positive ? '+' : ''}{delta.value}
            </span>
          )}
        </div>
        <div className="mt-5 flex items-baseline gap-3">
          <span className={`font-serif text-5xl font-semibold tracking-tight bg-gradient-to-br bg-clip-text text-transparent ${accents[accent] || accents.charcoal}`}>
            {value}
          </span>
        </div>
        {sub && (
          <p className="mt-4 text-sm text-charcoal-50">{sub}</p>
        )}
      </div>
    </div>
  )
}
