'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import AuthModal from '@/components/AuthModal'
import UpgradeModal from '@/components/UpgradeModal'
import ReactMarkdown from 'react-markdown'
import Quiz, { QuizQuestion } from '@/components/Quiz'
import BlurredQuiz from '@/components/BlurredQuiz'
import NotesLoader from '@/components/NotesLoader'

interface VideoUploadNote {
  id: string
  title: string
  content: string
  summary: string
  quiz: QuizQuestion[]
  created_at: string
}

export default function UploadVideoPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const { canGenerateNotes, canSaveNotes, canUseQuizzes, refreshUsage } = useSubscription()
  
  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  
  // Processing state
  const [uploadProgress, setUploadProgress] = useState(0)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [notesProgress, setNotesProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<'idle' | 'uploading' | 'transcribing' | 'generating' | 'complete'>('idle')
  
  // Results state
  const [generatedNote, setGeneratedNote] = useState<VideoUploadNote | null>(null)
  const [showFullNotes, setShowFullNotes] = useState(true)
  
  // Modal state
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
    // Check file size (limit to 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    // Check if it's a video file
    const allowedTypes = [
      'video/mp4',
      'video/mov',
      'video/quicktime',
      'video/webm',
      'video/avi',
      'video/mkv'
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a video file (.mp4, .mov, .webm, .avi, .mkv)')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a video file to upload')
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

    setIsProcessing(true)
    setError('')
    setCurrentStep('uploading')
    setUploadProgress(0)

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

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      // Set up response handling
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (e) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.message || 'Upload failed'))
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })
      })

      // Start the upload
      xhr.open('POST', '/api/upload-video')
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.send(formData)

      const result = await uploadPromise

      if (result.success && result.data) {
        setGeneratedNote(result.data)
        setCurrentStep('complete')
        
        // Refresh usage data
        await refreshUsage()
      } else {
        throw new Error(result.message || 'Failed to process video')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process video. Please try again.')
      console.error('Error:', err)
      setCurrentStep('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setTitle('')
    setError('')
    setCurrentStep('idle')
    setUploadProgress(0)
    setTranscriptionProgress(0)
    setNotesProgress(0)
    setGeneratedNote(null)
  }

  const renderProgressStep = (step: string, isActive: boolean, isComplete: boolean) => {
    const getIcon = () => {
      switch (step) {
        case 'uploading': return '📤'
        case 'transcribing': return '🎤'
        case 'generating': return '🧠'
        case 'complete': return '✅'
        default: return '⭕'
      }
    }

    const getStatus = () => {
      switch (step) {
        case 'uploading': return 'Uploading Video'
        case 'transcribing': return 'Transcribing Audio'
        case 'generating': return 'Generating Notes'
        case 'complete': return 'Complete'
        default: return 'Waiting'
      }
    }

    return (
      <div className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
        isActive ? 'transform scale-105' : ''
      }`} style={{
        background: isActive 
          ? 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)'
          : isComplete 
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
          : 'var(--bg-secondary)',
        border: `1px solid ${isActive ? 'var(--color-video)' : isComplete ? 'rgba(34, 197, 94, 0.3)' : 'var(--bg-tertiary)'}`,
        boxShadow: isActive ? 'var(--glow-video)' : 'var(--shadow-sm)'
      }}>
        <span className="text-2xl">{getIcon()}</span>
        <div>
          <p className="font-semibold" style={{
            color: isActive 
              ? 'var(--bg-primary)'
              : isComplete 
              ? '#22c55e'
              : 'var(--text-primary)'
          }}>
            {getStatus()}
          </p>
          {isActive && step === 'uploading' && (
            <div className="w-32 rounded-full h-2 mt-1" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${uploadProgress}%`,
                  background: 'white'
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Loading Overlay */}
      {isProcessing && (
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
              message="Processing Video..."
              subMessage="This could take 5-10 minutes – please wait while we transcribe and analyze your video."
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
              background: 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)',
              boxShadow: 'var(--glow-video)'
            }}>
              <svg className="w-10 h-10" fill="white" viewBox="0 0 24 24">
                <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Upload Video for Notes</h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Upload your video files and convert them into comprehensive notes using AI transcription and analysis.
            </p>
          </div>

          {!generatedNote ? (
            <>
              {/* Instructions */}
              <div className="rounded-2xl p-6 mb-8" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-video)' }}>Supported video formats:</h3>
                <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
                  <li><strong>MP4 files</strong> - Most common video format</li>
                  <li><strong>MOV files</strong> - Apple QuickTime format</li>
                  <li><strong>WEBM files</strong> - Web-optimized format</li>
                  <li><strong>AVI files</strong> - Audio Video Interleave format</li>
                  <li><strong>MKV files</strong> - Matroska video format</li>
                </ul>
                <div className="mt-4 p-4 rounded-xl" style={{ 
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#f59e0b' }}>Processing Time Notice</h4>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Video processing typically takes 5-10 minutes</strong> depending on video length. 
                        Please be patient while we:
                      </p>
                      <ul className="text-sm list-disc list-inside ml-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        <li>Extract and transcribe audio using AI speech recognition</li>
                        <li>Generate comprehensive notes from the transcript</li>
                        <li>Create practice quizzes and summaries</li>
                      </ul>
                      <p className="text-sm mt-2 font-semibold" style={{ color: '#f59e0b' }}>
                        💡 Keep this tab open during processing - closing it may interrupt the upload.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-2xl p-4 mb-6" style={{ 
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
                }}>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">❌</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>Upload Error</h3>
                      <p className="mb-3" style={{ color: '#ef4444' }}>{error}</p>
                      
                      {/* Diagnostic information */}
                      <details className="rounded p-3" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                        <summary className="cursor-pointer text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>
                          🔍 Troubleshooting Tips
                        </summary>
                        <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                          <p><strong>If you're getting a "not a valid video" error:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Make sure your file is a video (MP4, MOV, WEBM, AVI, MKV)</li>
                            <li>Ensure the video contains audio (required for transcription)</li>
                            <li>Try a different video file to test</li>
                            <li>Check that the file isn't corrupted</li>
                          </ul>
                          
                          <p><strong>If upload keeps failing:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Try a smaller video file (under 50MB)</li>
                            <li>Check your internet connection</li>
                            <li>Refresh the page and try again</li>
                          </ul>
                          
                          <p className="text-xs mt-3" style={{ color: '#ef4444' }}>
                            <strong>Supported formats:</strong> MP4 (recommended), MOV, WEBM, AVI, MKV with audio
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="rounded-2xl p-6 mb-8" style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  border: '1px solid var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Processing Your Video</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderProgressStep('uploading', currentStep === 'uploading', ['transcribing', 'generating', 'complete'].includes(currentStep))}
                    {renderProgressStep('transcribing', currentStep === 'transcribing', ['generating', 'complete'].includes(currentStep))}
                    {renderProgressStep('generating', currentStep === 'generating', currentStep === 'complete')}
                  </div>
                  {currentStep === 'uploading' && (
                    <div className="mt-4">
                      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Uploading: {uploadProgress}%</p>
                    </div>
                  )}
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
                      className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-video)] focus:outline-none"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      disabled={isProcessing}
                    />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Give your notes a descriptive title to help you find them later
                    </p>
                  </div>

                  {/* Video Upload Area */}
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
                        ? 'var(--color-video)'
                        : file
                        ? 'var(--color-video)'
                        : 'var(--bg-tertiary)',
                      background: dragActive || file
                        ? 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 140, 0, 0.1))'
                        : 'var(--bg-primary)',
                      boxShadow: dragActive || file ? 'var(--glow-video)' : 'var(--shadow-sm)'
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ 
                          background: 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)',
                          boxShadow: 'var(--glow-video)'
                        }}>
                          <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                            <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
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
                          disabled={isProcessing}
                        >
                          Remove file
                        </button>
                      </div>
                    ) :
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ 
                          background: 'var(--bg-tertiary)',
                          border: '2px dashed var(--bg-tertiary)'
                        }}>
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                            <path d="M14,2V8H20L14,2M15,22H5C4.45,22 4,21.55 4,21V3C4,2.45 4.45,2 5,2H13L19,8V21C19,21.55 18.55,22 18,22H15Z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Drag and drop your video here
                          </p>
                          <p className="mb-3" style={{ color: 'var(--text-muted)' }}>or</p>
                          <label className="cursor-pointer">
                            <span className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 inline-block"
                              style={{ 
                                background: 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)',
                                color: 'var(--bg-primary)',
                                boxShadow: 'var(--glow-video)'
                              }}>
                              browse to choose a video file
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="video/mp4,video/mov,video/quicktime,video/webm,video/avi,video/mkv"
                              onChange={handleFileChange}
                              disabled={isProcessing}
                            />
                          </label>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          MP4, MOV, WEBM, AVI, MKV up to 100MB
                        </p>
                      </div>
                    }
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !file}
                    className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ 
                      background: (isProcessing || !file)
                        ? 'var(--bg-tertiary)' 
                        : 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)',
                      color: (isProcessing || !file) ? 'var(--text-muted)' : 'var(--bg-primary)',
                      boxShadow: (isProcessing || !file) ? 'var(--shadow-sm)' : 'var(--glow-video)'
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Generate Notes from Video'}
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
            </>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              {/* Success Message */}
              <div className="rounded-2xl p-4" style={{ 
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)'
              }}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#22c55e' }}>Notes Generated Successfully!</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Your video has been processed and notes have been generated.</p>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="rounded-2xl p-6" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{generatedNote.title}</h2>
                  <div className="note-view-toggle">
                    <button
                      onClick={() => setShowFullNotes(true)}
                      className={`px-4 py-2 rounded-l-xl border transition-all duration-300 ${
                        showFullNotes ? 'transform scale-105' : ''
                      }`}
                      style={{
                        background: showFullNotes 
                          ? 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)'
                          : 'var(--bg-primary)',
                        color: showFullNotes ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        borderColor: 'var(--bg-tertiary)',
                        boxShadow: showFullNotes ? 'var(--glow-video)' : 'var(--shadow-sm)'
                      }}
                    >
                      📖 Full Notes
                    </button>
                    <button
                      onClick={() => setShowFullNotes(false)}
                      className={`px-4 py-2 rounded-r-xl border-t border-r border-b transition-all duration-300 ${
                        !showFullNotes ? 'transform scale-105' : ''
                      }`}
                      style={{
                        background: !showFullNotes 
                          ? 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)'
                          : 'var(--bg-primary)',
                        color: !showFullNotes ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        borderColor: 'var(--bg-tertiary)',
                        boxShadow: !showFullNotes ? 'var(--glow-video)' : 'var(--shadow-sm)'
                      }}
                    >
                      📝 Summary
                    </button>
                  </div>
                </div>
                
                <div className="prose max-w-none prose-invert" style={{ color: 'var(--text-secondary)' }}>
                  {showFullNotes ? (
                    <ReactMarkdown>{generatedNote.content}</ReactMarkdown>
                  ) : (
                    <div className="summary-section">
                      <h3 style={{ color: 'var(--text-primary)' }}>📝 Summary Version</h3>
                      <ReactMarkdown>{generatedNote.summary || 'Summary not available.'}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Section */}
              {generatedNote.quiz && generatedNote.quiz.length > 0 && (
                <div className="rounded-2xl p-6" style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  border: '1px solid var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>📝 Test Your Knowledge</h2>
                  {canUseQuizzes ? (
                    <Quiz 
                      questions={generatedNote.quiz} 
                      noteId={generatedNote.id}
                      noteType="video"
                      onComplete={(score, total) => {
                        console.log(`Quiz completed: ${score}% (${score * total / 100}/${total})`);
                      }}
                    />
                  ) : (
                    <BlurredQuiz questionCount={generatedNote.quiz.length} />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-video) 0%, var(--color-cta) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--glow-video)'
                  }}
                >
                  Upload Another Video
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  View All Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Sign In to Upload Videos"
          message="Please sign in to start generating educational notes from your uploaded video files."
        />
      )}

      {/* Upgrade Modal */}
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