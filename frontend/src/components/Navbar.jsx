import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-beige-100/60 bg-cream-100/80 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-400 transition-transform duration-300 group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-cream-100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 18L13 6L18 18H8Z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-charcoal-300">DTEP</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-charcoal-50 mt-0.5">Digital Test &amp; Evaluation</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-charcoal-100 transition-colors duration-200 hover:text-olive-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/login"
            className="text-sm font-medium text-charcoal-200 transition-colors duration-200 hover:text-charcoal-400"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-charcoal-300 px-5 py-2.5 text-sm font-medium text-cream-100 transition-all duration-300 hover:bg-charcoal-400 hover:shadow-soft-lg"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.75} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-charcoal-300 lg:hidden transition-colors duration-200 hover:bg-beige-100"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in-up lg:hidden border-t border-beige-100 bg-cream-100">
          <div className="mx-auto max-w-7xl space-y-1 px-6 py-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-medium text-charcoal-200 transition-colors duration-200 hover:bg-beige-50 hover:text-charcoal-400"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-beige-100 pt-4">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-center text-base font-medium text-charcoal-200 transition-colors duration-200 hover:bg-beige-50"
              >
                Sign in
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-charcoal-300 px-4 py-3 text-center text-base font-medium text-cream-100 transition-colors duration-200 hover:bg-charcoal-400"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
