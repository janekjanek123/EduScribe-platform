'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import AuthModal from '@/components/AuthModal'
import UpgradeModal from '@/components/UpgradeModal'
import NotesLoader from '@/components/NotesLoader'

export default function TextGeneratePage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const { canGenerateNotes, canSaveNotes, limits, refreshUsage } = useSubscription()
  const [text, setText] = useState('')
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    
    // Check text length limit
    if (newText.length > limits.max_text_length) {
      setError(`Text length exceeds your plan limit of ${limits.max_text_length} characters.`)
      return
    }
    
    setText(newText)
    setError('')
  }

  const getTextLengthColor = () => {
    const ratio = text.length / limits.max_text_length
    if (ratio >= 1) return { color: '#ef4444' }
    if (ratio >= 0.9) return { color: '#f59e0b' }
    return { color: 'var(--text-muted)' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('Please enter some text to generate notes from')
      return
    }

    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Check text length limit
    if (text.length > limits.max_text_length) {
      setUpgradeModalConfig({
        title: 'Text Length Limit Exceeded',
        message: `Your text is ${text.length} characters, but your plan allows up to ${limits.max_text_length} characters. Upgrade your plan for longer text support.`,
        feature: 'extended text length'
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

      const response = await fetch('/api/text-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          text: text.trim(),
          title: title.trim() || undefined
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Text Generate] Note generation successful:', result)
        
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
              subMessage="This could take a moment – please wait while we process your text content."
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
              background: 'linear-gradient(135deg, var(--color-text) 0%, var(--color-cta) 100%)',
              boxShadow: 'var(--glow-text)'
            }}>
              <svg className="w-10 h-10" fill="white" viewBox="0 0 24 24">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M1,11H3V21H21V13H23V21A2,2 0 0,1 21,23H3A2,2 0 0,1 1,21V11Z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Text Input Notes</h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Paste any text content and transform it into well-structured, comprehensive notes.
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl p-6 mb-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>How to use:</h3>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>Copy text from articles, books, research papers, or any source</li>
              <li>Paste it in the text area below</li>
              <li>Add an optional title to organize your notes</li>
              <li>Click "Generate Notes" to create structured summaries</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl" style={{ 
              background: 'linear-gradient(135deg, rgba(160, 32, 240, 0.1), rgba(147, 51, 234, 0.1))',
              border: '1px solid rgba(160, 32, 240, 0.3)'
            }}>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                <strong>Tip:</strong> The more detailed your input text, the more comprehensive 
                and useful your generated notes will be.
              </p>
            </div>
            
            {/* Text length limit info */}
            <div className="mt-4 p-3 rounded-xl" style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <p className="text-sm" style={{ color: 'var(--color-cta)' }}>
                <strong>Your plan allows up to {limits.max_text_length.toString()} characters.</strong>
                {limits.max_text_length < 50000 && (
                  <>
                    {' '}Need more? 
                    <button
                      onClick={() => router.push('/pricing')}
                      className="ml-1 underline hover:opacity-80 transition-opacity"
                    >
                      Upgrade your plan
                    </button>
                  </>
                )}
              </p>
            </div>
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
              <div>
                <label htmlFor="title" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your notes..."
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-text)] focus:outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="text" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Text Content
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Paste your text content here..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-text)] focus:outline-none resize-vertical"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm" style={getTextLengthColor()}>
                    {text.length.toString()} / {limits.max_text_length.toString()} characters
                  </p>
                  {text.length > limits.max_text_length * 0.9 && (
                    <span className="text-xs" style={{ color: '#f59e0b' }}>
                      Approaching limit
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !text.trim() || text.length > limits.max_text_length}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: (isLoading || !text.trim() || text.length > limits.max_text_length)
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, var(--color-text) 0%, var(--color-cta) 100%)',
                  color: (isLoading || !text.trim() || text.length > limits.max_text_length) ? 'var(--text-muted)' : 'var(--bg-primary)',
                  boxShadow: (isLoading || !text.trim() || text.length > limits.max_text_length) ? 'var(--shadow-sm)' : 'var(--glow-text)'
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
        title="Sign In to Generate Notes"
        message="Please sign in to start generating educational notes from your text content."
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