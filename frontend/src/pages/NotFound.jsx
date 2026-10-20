import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-paper flex items-center justify-center overflow-hidden">
      <div
        className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-olive-200/50 via-beige-100/70 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-terracotta-100/40 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-6 text-center py-26">
        <p className="animate-fade-in-up font-serif text-[12rem] leading-none font-semibold tracking-tighter text-olive-400/20 md:text-[16rem]" style={{ animationDelay: '0.05s' }}>
          404
        </p>
        <div className="-mt-10">
          <h1 className="animate-fade-in-up font-serif text-h2 font-semibold text-charcoal-300" style={{ animationDelay: '0.15s' }}>
            This page took a detour.
          </h1>
          <p className="animate-fade-in-up mt-5 text-body-lg text-charcoal-100 max-w-md mx-auto" style={{ animationDelay: '0.23s' }}>
            The link may be broken, or the page may have been moved. Let's get you back on track.
          </p>
          <div className="animate-fade-in-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: '0.31s' }}>
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 rounded-full bg-charcoal-300 px-6 py-3.5 text-sm font-semibold text-cream-100 transition-all duration-300 hover:bg-charcoal-400 hover:-translate-y-0.5 hover:shadow-soft-xl"
            >
              <Home className="h-4 w-4" strokeWidth={1.75} />
              Return home
            </Link>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2.5 rounded-full border border-beige-200 bg-white px-6 py-3.5 text-sm font-semibold text-charcoal-300 transition-all duration-300 hover:border-beige-300 hover:shadow-soft"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={1.75} />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
