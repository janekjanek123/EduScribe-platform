import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from 'react-hot-toast'
import { SupabaseProvider } from '@/lib/supabase-provider'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import I18nProvider from '@/components/I18nProvider'

const montserrat = Montserrat({ 
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'EduScribe - AI-Powered Note Generation',
  description: 'Generate comprehensive notes from YouTube videos, files, and text using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <I18nProvider>
          <SupabaseProvider>
            <SubscriptionProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster position="top-right" />
            </SubscriptionProvider>
          </SupabaseProvider>
        </I18nProvider>
      </body>
    </html>
  )
} 