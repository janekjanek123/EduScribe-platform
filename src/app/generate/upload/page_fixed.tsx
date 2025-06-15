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
              subMessage="This could take a moment – please wait while we process your file."
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
              background: 'linear-gradient(135deg, var(--color-file) 0%, var(--color-cta) 100%)',
              boxShadow: 'var(--glow-file)'
            }}>
              <svg className="w-10 h-10" fill="white" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Upload File for Notes</h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Upload your documents and convert them into organized, searchable notes.
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl p-6 mb-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-file)' }}>Supported file types:</h3>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li><strong>PDF files</strong> - Documents, research papers, articles</li>
              <li><strong>Word documents</strong> - .doc and .docx files</li>
              {canUploadPPT && (
                <li><strong>PowerPoint presentations</strong> - .ppt and .pptx files</li>
              )}
              <li><strong>Text files</strong> - .txt files with plain text</li>
            </ul>
            {!canUploadPPT && (
              <div className="mt-4 p-3 rounded-xl" style={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <p className="text-sm" style={{ color: 'var(--color-cta)' }}>
                  <strong>💡 Want PowerPoint support?</strong> Upgrade to Student or Pro plan to upload presentations.
                  <button
                    onClick={() => router.push('/pricing')}
                    className="ml-2 underline hover:opacity-80 transition-opacity"
                  >
                    View Plans
                  </button>
                </p>
              </div>
            )}
            <div className="mt-4 p-3 rounded-xl" style={{ 
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <p className="text-sm" style={{ color: 'var(--color-file)' }}>
                <strong>Tip:</strong> For best results, ensure your file contains clear, readable text. 
                {canUploadPPT && ' PowerPoint slides will be converted with slide titles as section headings.'}
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

          {/* Upload Form */}
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
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-file)] focus:outline-none"
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

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'scale-102'
                    : file
                    ? 'scale-102'
                    : 'hover:scale-101'
                }`}
                style={{
                  borderColor: dragActive
                    ? 'var(--color-file)'
                    : file
                    ? 'var(--color-file)'
                    : 'var(--bg-tertiary)',
                  background: dragActive || file
                    ? 'linear-gradient(135deg, rgba(138, 212, 255, 0.1), rgba(34, 197, 94, 0.1))'
                    : 'var(--bg-primary)',
                  boxShadow: dragActive || file ? 'var(--glow-file)' : 'var(--shadow-sm)'
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ 
                      background: 'linear-gradient(135deg, var(--color-file) 0%, var(--color-cta) 100%)',
                      boxShadow: 'var(--glow-file)'
                    }}>
                      <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ 
                      background: 'var(--bg-tertiary)',
                      border: '2px dashed var(--bg-tertiary)'
                    }}>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                        <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Drag and drop your file here
                      </p>
                      <p className="mb-3" style={{ color: 'var(--text-muted)' }}>or</p>
                      <label className="cursor-pointer">
                        <span className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 inline-block"
                          style={{ 
                            background: 'linear-gradient(135deg, var(--color-file) 0%, var(--color-cta) 100%)',
                            color: 'var(--bg-primary)',
                            boxShadow: 'var(--glow-file)'
                          }}>
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
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      PDF, TXT, DOC, DOCX, PPT, PPTX up to 10MB
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !file}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: (isLoading || !file)
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, var(--color-file) 0%, var(--color-cta) 100%)',
                  color: (isLoading || !file) ? 'var(--text-muted)' : 'var(--bg-primary)',
                  boxShadow: (isLoading || !file) ? 'var(--shadow-sm)' : 'var(--glow-file)'
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