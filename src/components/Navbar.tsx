'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

/**
 * Navigation bar component that clearly separates the three note systems
 */
export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, isLoading } = useSupabase();
  const router = useRouter();
  
  // Determine which section is currently active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };
  
  const handleConfirmLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setShowLogoutConfirm(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setShowLogoutConfirm(false);
    }
  };
  
  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  return (
    <nav style={{ 
      background: 'var(--bg-secondary)', 
      borderBottom: '1px solid var(--bg-tertiary)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl transition-all duration-300 hover:scale-105" style={{ 
              color: 'var(--text-primary)',
              textShadow: 'var(--glow-cta)'
            }}>
              EduScribe
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-all duration-300 hover:scale-105 ${
                pathname === '/' ? 'font-semibold' : ''
              }`}
              style={{ 
                color: pathname === '/' ? 'var(--color-cta)' : 'var(--text-secondary)',
                textShadow: pathname === '/' ? 'var(--glow-cta)' : 'none'
              }}
            >
              {t('nav.home')}
            </Link>

            <Link 
              href="/notes" 
              className={`transition-all duration-300 hover:scale-105 ${
                isActive('/notes') ? 'font-semibold' : ''
              }`}
              style={{ 
                color: isActive('/notes') ? 'var(--color-cta)' : 'var(--text-secondary)',
                textShadow: isActive('/notes') ? 'var(--glow-cta)' : 'none'
              }}
            >
              Notes
            </Link>
            
            <Link 
              href="/pricing" 
              className={`transition-all duration-300 hover:scale-105 ${
                isActive('/pricing') ? 'font-semibold' : ''
              }`}
              style={{ 
                color: isActive('/pricing') ? 'var(--color-cta)' : 'var(--text-secondary)',
                textShadow: isActive('/pricing') ? 'var(--glow-cta)' : 'none'
              }}
            >
              {t('nav.pricing')}
            </Link>
            
            <Link 
              href="/about" 
              className={`transition-all duration-300 hover:scale-105 ${
                isActive('/about') ? 'font-semibold' : ''
              }`}
              style={{ 
                color: isActive('/about') ? 'var(--color-cta)' : 'var(--text-secondary)',
                textShadow: isActive('/about') ? 'var(--glow-cta)' : 'none'
              }}
            >
              {t('nav.about')}
            </Link>

            <Link 
              href="/help" 
              className={`transition-all duration-300 hover:scale-105 ${
                isActive('/help') ? 'font-semibold' : ''
              }`}
              style={{ 
                color: isActive('/help') ? 'var(--color-cta)' : 'var(--text-secondary)',
                textShadow: isActive('/help') ? 'var(--glow-cta)' : 'none'
              }}
            >
              {t('nav.help')}
            </Link>
            
            {/* Show Dashboard link only when logged in */}
            {user && (
              <Link 
                href="/dashboard" 
                className={`transition-all duration-300 hover:scale-105 ${
                  isActive('/dashboard') ? 'font-semibold' : ''
                }`}
                style={{ 
                  color: isActive('/dashboard') ? 'var(--color-cta)' : 'var(--text-secondary)',
                  textShadow: isActive('/dashboard') ? 'var(--glow-cta)' : 'none'
                }}
              >
                {t('dashboard.myNotes')}
              </Link>
            )}
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Authentication Button */}
            {!isLoading && (
              user ? (
                <button
                  onClick={handleLogoutClick}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {t('nav.logout')}
                </button>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--color-cta)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {t('nav.login')}
                </Link>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Language Selector for Mobile */}
            <LanguageSelector />
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="transition-all duration-300 hover:scale-110 focus:outline-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid var(--bg-tertiary)' }}>
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  pathname === '/' ? 'text-gray-900 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>

              <Link 
                href="/notes" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/notes') ? 'text-gray-900 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Notes
              </Link>
              
              <Link 
                href="/pricing" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/pricing') ? 'text-gray-900 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.pricing')}
              </Link>
              
              <Link 
                href="/about" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/about') ? 'text-gray-900 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.about')}
              </Link>

              <Link 
                href="/help" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/help') ? 'text-gray-900 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.help')}
              </Link>
              
              {/* Show Dashboard link only when logged in */}
              {user && (
                <Link 
                  href="/dashboard" 
                  className={`text-gray-600 hover:text-gray-900 transition-colors ${
                    isActive('/dashboard') ? 'text-gray-900 font-medium' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('dashboard.myNotes')}
                </Link>
              )}
              
              {/* Authentication Button */}
              {!isLoading && (
                user ? (
                  <button
                    onClick={handleLogoutClick}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-left"
                  >
                    {t('nav.logout')}
                  </button>
                ) : (
                  <Link 
                    href="/auth/login" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('auth.signOut')}</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? You'll need to sign in again to access your notes and quizzes.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {t('forms.cancel')}
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 