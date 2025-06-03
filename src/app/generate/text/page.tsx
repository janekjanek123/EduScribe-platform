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
          title: title.trim() || 'Text Notes'
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

  const getTextLengthColor = () => {
    const percentage = (text.length / limits.max_text_length) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
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
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✏️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Text Input Notes</h1>
            <p className="text-lg text-gray-600">
              Paste any text content and transform it into well-structured, comprehensive notes.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-purple-900 mb-3">How to use:</h3>
            <ul className="list-disc list-inside space-y-2 text-purple-800">
              <li>Copy text from articles, books, research papers, or any source</li>
              <li>Paste it in the text area below</li>
              <li>Add an optional title to organize your notes</li>
              <li>Click "Generate Notes" to create structured summaries</li>
            </ul>
            <div className="mt-4 p-3 bg-purple-100 rounded">
              <p className="text-sm text-purple-700">
                <strong>Tip:</strong> The more detailed your input text, the more comprehensive 
                and useful your generated notes will be.
              </p>
            </div>
            
            {/* Text length limit info */}
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Your plan allows up to {limits.max_text_length.toString()} characters.</strong>
                {limits.max_text_length < 50000 && (
                  <>
                    {' '}Need more? 
                    <button
                      onClick={() => router.push('/pricing')}
                      className="ml-1 text-blue-600 hover:text-blue-800 underline"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                  Text Content
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Paste your text content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm ${getTextLengthColor()}`}>
                    {text.length.toString()} / {limits.max_text_length.toString()} characters
                  </p>
                  {text.length > limits.max_text_length * 0.9 && (
                    <span className="text-xs text-yellow-600">
                      Approaching limit
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !text.trim() || text.length > limits.max_text_length}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Generate Notes'}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-purple-600 hover:text-purple-800 hover:underline"
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