'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="py-12" style={{ 
      background: 'var(--bg-secondary)', 
      borderTop: '1px solid var(--bg-tertiary)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4" style={{ 
              color: 'var(--text-primary)', 
              textShadow: 'var(--glow-cta)'
            }}>
              EduScribe
            </h3>
            <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--text-primary)' }}>
              {t('footer.navigation')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--text-primary)' }}>
              {t('footer.documentation')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/terms-of-use" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('footer.termsOfUse')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="footer-link transition-all duration-300 hover:scale-105 hover:translate-x-1" style={{ 
                  color: 'var(--text-secondary)'
                }}>
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--bg-tertiary)' }}>
          <p className="text-sm text-center font-medium" style={{ color: 'var(--text-muted)' }}>
            &copy; {currentYear} EduScribe. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
} 