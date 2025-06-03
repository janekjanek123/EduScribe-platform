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
      <div className={`flex items-center space-x-3 p-3 rounded-lg ${
        isActive ? 'bg-blue-50 border-2 border-blue-200' : 
        isComplete ? 'bg-green-50 border-2 border-green-200' : 
        'bg-gray-50 border-2 border-gray-200'
      }`}>
        <span className="text-2xl">{getIcon()}</span>
        <div>
          <p className={`font-medium ${
            isActive ? 'text-blue-900' : 
            isComplete ? 'text-green-900' : 
            'text-gray-600'
          }`}>
            {getStatus()}
          </p>
          {isActive && step === 'uploading' && (
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
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
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Video for Notes</h1>
            <p className="text-lg text-gray-600">
              Upload your video files and convert them into comprehensive notes using AI transcription and analysis.
            </p>
          </div>

          {!generatedNote ? (
            <>
              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-purple-900 mb-3">Supported video formats:</h3>
                <ul className="list-disc list-inside space-y-2 text-purple-800">
                  <li><strong>MP4 files</strong> - Most common video format</li>
                  <li><strong>MOV files</strong> - Apple QuickTime format</li>
                  <li><strong>WEBM files</strong> - Web-optimized format</li>
                  <li><strong>AVI files</strong> - Audio Video Interleave format</li>
                  <li><strong>MKV files</strong> - Matroska video format</li>
                </ul>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-2">Processing Time Notice</h4>
                      <p className="text-sm text-amber-700 mb-2">
                        <strong>Video processing typically takes 5-10 minutes</strong> depending on video length. 
                        Please be patient while we:
                      </p>
                      <ul className="text-sm text-amber-700 list-disc list-inside ml-2 space-y-1">
                        <li>Extract and transcribe audio using AI speech recognition</li>
                        <li>Generate comprehensive notes from the transcript</li>
                        <li>Create practice quizzes and summaries</li>
                      </ul>
                      <p className="text-sm text-amber-700 mt-2 font-medium">
                        💡 Keep this tab open during processing - closing it may interrupt the upload.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">❌</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">Upload Error</h3>
                      <p className="text-red-800 mb-3">{error}</p>
                      
                      {/* Diagnostic information */}
                      <details className="bg-red-100 rounded p-3">
                        <summary className="cursor-pointer text-sm font-medium text-red-700 mb-2">
                          🔍 Troubleshooting Tips
                        </summary>
                        <div className="text-sm text-red-700 space-y-2">
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
                          
                          <p className="text-xs mt-3 text-red-600">
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
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Your Video</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderProgressStep('uploading', currentStep === 'uploading', ['transcribing', 'generating', 'complete'].includes(currentStep))}
                    {renderProgressStep('transcribing', currentStep === 'transcribing', ['generating', 'complete'].includes(currentStep))}
                    {renderProgressStep('generating', currentStep === 'generating', currentStep === 'complete')}
                  </div>
                  {currentStep === 'uploading' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 text-center">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      disabled={isProcessing}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Give your notes a descriptive title to help you find them later
                    </p>
                  </div>

                  {/* Video Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-purple-500 bg-purple-50'
                        : file
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl">🎥</span>
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
                          disabled={isProcessing}
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl">🎬</span>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            Drag and drop your video here
                          </p>
                          <p className="text-gray-500">or</p>
                          <label className="cursor-pointer">
                            <span className="text-purple-600 hover:text-purple-800 font-medium">
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
                        <p className="text-sm text-gray-500">
                          MP4, MOV, WEBM, AVI, MKV up to 100MB
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !file}
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Generate Notes from Video'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Notes Generated Successfully!</h3>
                    <p className="text-green-700">Your video has been processed and notes have been generated.</p>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{generatedNote.title}</h2>
                  <div className="note-view-toggle">
                    <button
                      onClick={() => setShowFullNotes(true)}
                      className={`px-4 py-2 rounded-l-lg border ${showFullNotes 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      📖 Full Notes
                    </button>
                    <button
                      onClick={() => setShowFullNotes(false)}
                      className={`px-4 py-2 rounded-r-lg border-t border-r border-b ${!showFullNotes 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      📝 Summary
                    </button>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  {showFullNotes ? (
                    <ReactMarkdown>{generatedNote.content}</ReactMarkdown>
                  ) : (
                    <div className="summary-section">
                      <h3>📝 Summary Version</h3>
                      <ReactMarkdown>{generatedNote.summary || 'Summary not available.'}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Section */}
              {generatedNote.quiz && generatedNote.quiz.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Test Your Knowledge</h2>
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
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upload Another Video
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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

      <style jsx>{`
        .note-view-toggle {
          display: flex;
          border-radius: 0.5rem;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
} 