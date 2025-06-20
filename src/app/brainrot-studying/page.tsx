'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface FormData {
  topic: string
  description: string
  videoBackground: string
  avatar: string
  sourceFile: File | null
}

interface VideoPreview {
  id: string
  thumbnailUrl: string
  videoUrl: string
  createdAt: string
}

export default function BrainrotStudyingPage() {
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    description: '',
    videoBackground: '',
    avatar: 'default',
    sourceFile: null
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const videoBackgrounds = [
    { id: 'minecraft', name: 'Minecraft Parkour', preview: '/api/placeholder/minecraft-bg.jpg' },
    { id: 'subway', name: 'Subway Surfers', preview: '/api/placeholder/subway-bg.jpg' },
    { id: 'satisfying', name: 'Satisfying Visuals', preview: '/api/placeholder/satisfying-bg.jpg' }
  ]

  const avatars = [
    { id: 'default', name: 'Default Avatar', preview: '/api/placeholder/avatar-default.jpg' }
  ]

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleInputChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.random() * 15
      })
    }, 200)
    return interval
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid document file (.pdf, .docx, .txt, .pptx)')
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB')
        return
      }
      
      handleInputChange('sourceFile', file)
    }
  }

  const removeFile = () => {
    handleInputChange('sourceFile', null)
  }

  const handleGenerate = async () => {
    if (!formData.topic || (!formData.description && !formData.sourceFile) || !formData.videoBackground) {
      setError('Please fill in topic, either description or upload a file, and select a video background')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setError(null)

    const progressInterval = simulateProgress()

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('topic', formData.topic)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('videoBackground', formData.videoBackground)
      formDataToSend.append('avatar', formData.avatar)
      
      if (formData.sourceFile) {
        formDataToSend.append('sourceFile', formData.sourceFile)
      }

      const response = await fetch('/api/generate-brainrot', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()
      
      // Complete progress
      setGenerationProgress(100)
      
      // Simulate video preview
      setTimeout(() => {
        setVideoPreview({
          id: 'preview-' + Date.now(),
          thumbnailUrl: '/api/placeholder/video-thumbnail.jpg',
          videoUrl: '/api/placeholder/brainrot-video.mp4',
          createdAt: new Date().toISOString()
        })
        setIsGenerating(false)
      }, 1000)

    } catch (error) {
      console.error('Generation error:', error)
      setError('Failed to generate video. Please try again.')
      setIsGenerating(false)
    } finally {
      clearInterval(progressInterval)
    }
  }

  const resetForm = () => {
    setFormData({
      topic: '',
      description: '',
      videoBackground: '',
      avatar: 'default',
      sourceFile: null
    })
    setVideoPreview(null)
    setError(null)
    setGenerationProgress(0)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="relative py-8 px-6" style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/ai-tools" className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:text-purple-400" style={{ color: 'var(--text-secondary)' }}>
            <span>←</span> Back to AI Tools
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ 
                background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
              }}>
                🔥
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Brainrot Studying
              </h1>
            </div>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Transform boring study material into engaging, viral-style learning content
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Input Form */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '2px solid #8B5CF630',
              boxShadow: '0 0 30px #8B5CF615'
            }}>
              <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Create Your Brainrot Study Video
              </h2>

              {/* Topic Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Study Topic *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  placeholder="e.g., Photosynthesis, World War 2, Calculus..."
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ 
                    background: 'var(--bg-primary)',
                    border: '2px solid #8B5CF630'
                  }}
                />
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Description & Key Points {!formData.sourceFile && '*'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you want to learn about this topic. Include key points, concepts, or specific areas you want to focus on..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  style={{ 
                    background: 'var(--bg-primary)',
                    border: '2px solid #8B5CF630'
                  }}
                />
                {formData.sourceFile && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Optional: Add extra context or leave blank to use uploaded file content
                  </p>
                )}
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Upload Source Document {!formData.description && '*'}
                </label>
                
                {/* Upload Area */}
                {!formData.sourceFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.pptx,.ppt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="border-2 border-dashed border-purple-500/50 rounded-xl p-8 text-center hover:border-purple-500/80 transition-colors duration-300">
                      <div className="text-4xl mb-4">📄</div>
                      <div className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Drop your document here or click to browse
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Supports: PDF, Word (.docx), Text (.txt), PowerPoint (.pptx)
                      </div>
                      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        Maximum file size: 50MB
                      </div>
                    </div>
                  </div>
                ) : (
                  /* File Preview */
                  <div className="p-4 rounded-xl flex items-center justify-between" style={{ 
                    background: 'var(--bg-primary)',
                    border: '2px solid #8B5CF650'
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        {formData.sourceFile.type.includes('pdf') ? '📄' :
                         formData.sourceFile.type.includes('word') ? '📝' :
                         formData.sourceFile.type.includes('presentation') ? '📊' : '📋'}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formData.sourceFile.name}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {(formData.sourceFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors duration-300"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  💡 Upload your study materials and we'll extract the content to create your brainrot video
                </div>
              </div>

              {/* Video Background Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Video Background *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {videoBackgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleInputChange('videoBackground', bg.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.videoBackground === bg.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 hover:border-purple-400'
                      }`}
                      style={{ background: formData.videoBackground === bg.id ? '#8B5CF620' : 'var(--bg-primary)' }}
                    >
                      <div className="aspect-video bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-2xl">
                        {bg.id === 'minecraft' ? '⛏️' : bg.id === 'subway' ? '🚇' : '✨'}
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {bg.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Avatar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleInputChange('avatar', avatar.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                        formData.avatar === avatar.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 hover:border-purple-400'
                      }`}
                      style={{ background: formData.avatar === avatar.id ? '#8B5CF620' : 'var(--bg-primary)' }}
                    >
                      <div className="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {avatar.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ 
                  background: isGenerating 
                    ? 'linear-gradient(135deg, #8B5CF650, #8B5CF630)' 
                    : 'linear-gradient(135deg, #8B5CF6, #A855F7)',
                  boxShadow: '0 0 30px #8B5CF640'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Brainrot Video 🔥'}
              </button>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>Progress</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        background: 'linear-gradient(90deg, #8B5CF6, #A855F7)',
                        width: `${generationProgress}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '2px solid #8B5CF630',
              boxShadow: '0 0 30px #8B5CF615'
            }}>
              <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Video Preview
              </h2>

              {!videoPreview ? (
                <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎬</div>
                    <p className="text-gray-400">Your brainrot video will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      poster={videoPreview.thumbnailUrl}
                    >
                      <source src={videoPreview.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Watermark */}
                    <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-lg">
                      <span className="text-white text-sm font-medium">Eduscribe.ai</span>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formData.topic}
                      </h3>
                      <span className="text-sm px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        Generated
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {formData.description.slice(0, 100)}...
                    </p>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created: {new Date(videoPreview.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: 'white'
                      }}
                    >
                      Download Video
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      style={{ 
                        background: 'var(--bg-primary)',
                        border: '2px solid #8B5CF650',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Create New
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Features Info */}
            <div className="p-6 rounded-2xl" style={{ 
              background: 'linear-gradient(135deg, #8B5CF612, transparent)',
              border: '2px solid #8B5CF625'
            }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                What's Included
              </h3>
              <div className="space-y-3">
                {[
                  'AI-generated TikTok-style voiceover',
                  'Engaging visual animations',
                  'Meme-style text overlays',
                  'Trending background music',
                  'Optimized for social sharing'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }
      `}</style>
    </div>
  )
} 