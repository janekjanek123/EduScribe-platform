'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import AuthModal from '@/components/AuthModal'
import UpgradeModal from '@/components/UpgradeModal'
import NotesLoader from '@/components/NotesLoader'

export default function UploadGeneratePage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const { canUploadPPT, canGenerateNotes, canSaveNotes, refreshUsage } = useSubscription()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalConfig, setUpgradeModalConfig] = useState({
    title: '',
    message: '',
    feature: ''
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Check if it's a PowerPoint file
    const isPowerPoint = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint' // ppt
    ].includes(selectedFile.type)

    // If it's PowerPoint and user can't upload PPT, show upgrade modal
    if (isPowerPoint && !canUploadPPT) {
      setUpgradeModalConfig({
        title: 'PowerPoint Upload Restricted',
        message: 'Upgrade to Student or Pro plan to upload PowerPoint presentations.',
        feature: 'PowerPoint uploads'
      })
      setShowUpgradeModal(true)
      return
    }

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]

    // Add PowerPoint types if user has access
    if (canUploadPPT) {
      allowedTypes.push(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
        'application/vnd.ms-powerpoint' // ppt
      )
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      const supportedTypes = canUploadPPT 
        ? 'PDF, TXT, DOC, DOCX, PPT, or PPTX files'
        : 'PDF, TXT, DOC, or DOCX files'
      setError(`Please upload ${supportedTypes}`)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
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

      const formData = new FormData()
      formData.append('file', file)
      if (title.trim()) {
        formData.append('title', title.trim())
      }

      const response = await fetch('/api/file-notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Upload Generate] Note generation successful:', result)
        
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
              subMessage="This could take a moment – please wait while we process your file."
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload File for Notes</h1>
            <p className="text-lg text-gray-600">
              Upload your documents and convert them into organized, searchable notes.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-green-900 mb-3">Supported file types:</h3>
            <ul className="list-disc list-inside space-y-2 text-green-800">
              <li><strong>PDF files</strong> - Documents, research papers, articles</li>
              <li><strong>Word documents</strong> - .doc and .docx files</li>
              {canUploadPPT && (
                <li><strong>PowerPoint presentations</strong> - .ppt and .pptx files</li>
              )}
              <li><strong>Text files</strong> - .txt files with plain text</li>
            </ul>
            {!canUploadPPT && (
              <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>💡 Want PowerPoint support?</strong> Upgrade to Student or Pro plan to upload presentations.
                  <button
                    onClick={() => router.push('/pricing')}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    View Plans
                  </button>
                </p>
              </div>
            )}
            <div className="mt-4 p-3 bg-green-100 rounded">
              <p className="text-sm text-green-700">
                <strong>Tip:</strong> For best results, ensure your file contains clear, readable text. 
                {canUploadPPT && ' PowerPoint slides will be converted with slide titles as section headings.'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Form */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  disabled={isLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Give your notes a descriptive title to help you find them later
                </p>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-green-500 bg-green-50'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-green-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">📁</span>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drag and drop your file here
                      </p>
                      <p className="text-gray-500">or</p>
                      <label className="cursor-pointer">
                        <span className="text-green-600 hover:text-green-800 font-medium">
                          browse to choose a file
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, TXT, DOC, DOCX, PPT, PPTX up to 10MB
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !file}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Generate Notes'}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-green-600 hover:text-green-800 hover:underline"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Sign In to Upload Files"
          message="Please sign in to start generating educational notes from your uploaded files."
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title={upgradeModalConfig.title}
          message={upgradeModalConfig.message}
          feature={upgradeModalConfig.feature}
        />
      )}
    </div>
  )
} 