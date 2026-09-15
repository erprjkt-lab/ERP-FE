import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Container'
import { COMPANY, FOOTER_LINKS } from '@/data/site'

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-ink-300">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              We build ERP software and web platforms for engineering, healthcare, technology and
              manufacturing businesses.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {FOOTER_LINKS.company.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="link-underline inline-block transition-colors hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Services</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {FOOTER_LINKS.services.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="link-underline inline-block transition-colors hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>{COMPANY.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-400" />
                <span>{COMPANY.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-400" />
                <span>{COMPANY.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          <p>Enterprise Resource Planning Solutions</p>
        </div>
      </Container>
    </footer>
  )
}
