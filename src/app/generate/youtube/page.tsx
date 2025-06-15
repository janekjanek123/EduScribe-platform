'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import AuthModal from '@/components/AuthModal'
import UpgradeModal from '@/components/UpgradeModal'
import NotesLoader from '@/components/NotesLoader'

export default function YoutubeGeneratePage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const { canUseYouTube, canGenerateNotes, canSaveNotes, refreshUsage } = useSubscription()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalConfig, setUpgradeModalConfig] = useState({
    title: '',
    message: '',
    feature: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Check YouTube access
    if (!canUseYouTube) {
      setUpgradeModalConfig({
        title: 'YouTube Feature Restricted',
        message: 'Upgrade to Student or Pro plan to generate notes from YouTube videos.',
        feature: 'YouTube video processing'
      })
      setShowUpgradeModal(true)
      return
    }

    // Check generation limits
    if (!canGenerateNotes) {
      setUpgradeModalConfig({
        title: 'Monthly Limit Reached',
        message: "You've reached your plan limit. Upgrade your plan to generate more notes.",
        feature: 'additional note generation'
      })
      setShowUpgradeModal(true)
      return
    }

    // Check storage limits
    if (!canSaveNotes) {
      setUpgradeModalConfig({
        title: 'Storage Limit Reached',
        message: "You've reached your plan limit. Upgrade your plan to store more notes.",
        feature: 'additional note storage'
      })
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Authentication required. Please log in again.')
        return
      }

      const response = await fetch('/api/video-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          url,
          title: title.trim() || undefined
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[YouTube Generate] Note generation successful:', result)
        
        if (result.success && result.data) {
          // Refresh usage data
          await refreshUsage()
          
          // Redirect to dashboard to see the new note
          router.push('/dashboard')
        } else {
          throw new Error(result.message || 'Failed to generate notes')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate notes')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate notes. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }
         
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ 
            background: 'rgba(31, 34, 53, 0.9)',
            backdropFilter: 'blur(5px)'
          }}>
          <div className="p-8 max-w-md mx-4 rounded-2xl" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <NotesLoader 
              message="Generating Notes..."
              subMessage="This could take a moment – please wait while we process your YouTube video."
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
              background: 'linear-gradient(135deg, var(--color-youtube) 0%, var(--color-cta) 100%)',
              boxShadow: 'var(--glow-youtube)'
            }}>
              <svg className="w-10 h-10" fill="white" viewBox="0 0 24 24">
                <path d="M23.498 6.186c-.277-1.04-1.096-1.86-2.133-2.136C19.502 3.545 12 3.545 12 3.545s-7.502 0-9.365.505c-1.037.276-1.856 1.097-2.133 2.136C0 8.055 0 12 0 12s0 3.945.502 5.814c.277 1.039 1.096 1.86 2.133 2.136 1.863.505 9.365.505 9.365.505s7.502 0 9.365-.505c1.037-.276 1.856-1.097 2.133-2.136C24 15.945 24 12 24 12s0-3.945-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>YouTube Video Notes</h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Generate comprehensive notes from any YouTube video by pasting the URL below.
            </p>
          </div>
          
          {/* Instructions */}
          <div className="rounded-2xl p-6 mb-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-youtube)' }}>How to use:</h3>
            <ol className="list-decimal list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>Copy the YouTube video URL from your browser</li>
              <li>Paste it in the input field below</li>
              <li>Click "Generate Notes" and wait for processing</li>
              <li>Your notes will be ready in a few minutes</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl p-4 mb-6" style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
            }}>
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}
          
          {/* Form */}
          <div className="rounded-2xl p-8 mb-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a custom title for your notes..."
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-youtube)] focus:outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  disabled={isLoading}
                />
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Give your notes a descriptive title to help you find them later
                </p>
              </div>
          
              <div>
                <label htmlFor="url" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-youtube)] focus:outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: isLoading 
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, var(--color-youtube) 0%, var(--color-cta) 100%)',
                  color: isLoading ? 'var(--text-muted)' : 'var(--bg-primary)',
                  boxShadow: isLoading ? 'var(--shadow-sm)' : 'var(--glow-youtube)'
                }}
              >
                {isLoading ? 'Processing...' : 'Generate Notes'}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In to Generate Video Notes"
        message="Please sign in to start generating educational notes from YouTube videos."
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeModalConfig.title}
        message={upgradeModalConfig.message}
        feature={upgradeModalConfig.feature}
      />
    </div>
  )
}