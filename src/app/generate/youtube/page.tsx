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

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    if (!youtubeRegex.test(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true)
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
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
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
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📺</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">YouTube Video Notes</h1>
            <p className="text-lg text-gray-600">
              Generate comprehensive notes from any YouTube video by pasting the URL below.
            </p>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">How to use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Copy the YouTube video URL from your browser</li>
              <li>Paste it in the input field below</li>
              <li>Click "Generate Notes" and wait for processing</li>
              <li>Your notes will be ready in a few minutes</li>
            </ol>
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
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a custom title for your notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Give your notes a descriptive title to help you find them later
                </p>
              </div>
          
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Generate Notes'}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
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