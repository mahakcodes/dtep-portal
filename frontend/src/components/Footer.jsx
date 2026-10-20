import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
    Company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    Resources: [
      { label: 'Documentation', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'API Reference', href: '#' },
    ],
    Legal: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
    ],
  }

  return (
    <footer className="border-t border-beige-100 bg-cream-100">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-cream-100" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 18L13 6L18 18H8Z" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-charcoal-300">DTEP</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-charcoal-50">
              A precision-engineered platform for teams that take evaluation seriously. Plan, execute, and elevate with clarity.
            </p>
            <form className="flex max-w-sm items-center gap-2">
              <input
                type="email"
                placeholder="Enter your work email"
                className="h-11 flex-1 rounded-full border border-beige-200 bg-cream-50/50 px-5 text-sm text-charcoal-300 placeholder:text-charcoal-50 outline-none transition-all duration-200 focus:border-olive-300 focus:bg-cream-50"
              />
              <button
                type="submit"
                className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-olive-400 px-5 text-sm font-medium text-cream-100 transition-all duration-300 hover:bg-olive-500"
              >
                Subscribe
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
              </button>
            </form>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-300">{group}</h4>
              <ul className="space-y-3.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="group inline-flex items-center gap-1 text-sm text-charcoal-50 transition-colors duration-200 hover:text-olive-400"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-beige-100 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-charcoal-50">
            &copy; {year} DTEP Labs. Crafted with care.
          </p>
          <div className="flex items-center gap-6">
            {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-charcoal-50 transition-colors duration-200 hover:text-olive-400"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
