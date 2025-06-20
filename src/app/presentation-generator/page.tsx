'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

interface FormData {
  title: string
  description: string
  slideCount: number
  sources: {
    files: File[]
    links: string[]
  }
}

export default function PresentationGeneratorPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    slideCount: 10,
    sources: {
      files: [],
      links: ['']
    }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setFormData(prev => ({
        ...prev,
        sources: {
          ...prev.sources,
          files: [...prev.sources.files, ...newFiles]
        }
      }))
    }
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        files: prev.sources.files.filter((_, i) => i !== index)
      }
    }))
  }

  const handleLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        links: prev.sources.links.map((link, i) => i === index ? value : link)
      }
    }))
  }

  const addLinkField = () => {
    setFormData(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        links: [...prev.sources.links, '']
      }
    }))
  }

  const removeLinkField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        links: prev.sources.links.filter((_, i) => i !== index)
      }
    }))
  }

  const generatePresentation = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in the title and description fields.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationProgress(0)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('slideCount', formData.slideCount.toString())
      
      // Add files
      formData.sources.files.forEach((file, index) => {
        formDataToSend.append(`file_${index}`, file)
      })
      
      // Add links (filter out empty ones)
      const validLinks = formData.sources.links.filter(link => link.trim())
      formDataToSend.append('links', JSON.stringify(validLinks))

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        body: formDataToSend
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate presentation')
      }

      const result = await response.json()
      setGenerationProgress(100)
      setDownloadUrl(result.downloadUrl)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setGenerationProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      slideCount: 10,
      sources: {
        files: [],
        links: ['']
      }
    })
    setDownloadUrl(null)
    setError(null)
    setGenerationProgress(0)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="relative py-8 px-6" style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/ai-tools" className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:text-blue-400" style={{ color: 'var(--text-secondary)' }}>
            <span>←</span> Back to AI Tools
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ 
                background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
                boxShadow: '0 0 30px rgba(255, 107, 53, 0.3)'
              }}>
                🎯
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Presentation Generator
              </h1>
            </div>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Transform your ideas into stunning presentations with AI-powered slide generation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {!downloadUrl ? (
          <div className="space-y-8">
            {/* Form */}
            <div className="rounded-3xl p-8" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '2px solid rgba(255, 107, 53, 0.2)',
              boxShadow: '0 0 40px rgba(255, 107, 53, 0.1)'
            }}>
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Presentation Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter your presentation title..."
                    className="w-full p-4 rounded-xl text-lg transition-all duration-300 focus:scale-[1.02]"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '2px solid rgba(255, 107, 53, 0.3)',
                      color: 'var(--text-primary)',
                      boxShadow: '0 0 20px rgba(255, 107, 53, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 107, 53, 0.6)'
                      e.target.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 107, 53, 0.3)'
                      e.target.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.1)'
                    }}
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Presentation Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what your presentation should include, key topics, target audience, etc..."
                    rows={4}
                    className="w-full p-4 rounded-xl text-lg transition-all duration-300 focus:scale-[1.02] resize-none"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '2px solid rgba(255, 107, 53, 0.3)',
                      color: 'var(--text-primary)',
                      boxShadow: '0 0 20px rgba(255, 107, 53, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 107, 53, 0.6)'
                      e.target.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 107, 53, 0.3)'
                      e.target.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.1)'
                    }}
                  />
                </div>

                {/* Slide Count - Premium Modern Design */}
                <div>
                  <label className="block text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Number of Slides
                  </label>
                  
                  {/* Premium Slide Count Selector */}
                  <div className="relative mb-6">
                    {/* Background Card */}
                    <div className="rounded-2xl p-6" style={{
                      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                      border: '1px solid rgba(0, 255, 194, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                      
                      {/* Interactive Slider */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Quick Select
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-cta)' }}>
                            {formData.slideCount} slides
                          </span>
                        </div>
                        
                        {/* Premium Button Grid */}
                        <div className="grid grid-cols-4 gap-3">
                          {[5, 8, 10, 12, 15, 20, 25, 30].map(count => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => handleInputChange('slideCount', count)}
                              className={`group relative overflow-hidden rounded-xl transition-all duration-500 transform ${
                                formData.slideCount === count 
                                  ? 'scale-105 shadow-lg' 
                                  : 'hover:scale-102 hover:shadow-md'
                              }`}
                              style={{
                                background: formData.slideCount === count 
                                  ? 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-youtube) 100%)'
                                  : 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
                                border: formData.slideCount === count 
                                  ? '2px solid var(--color-cta)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: formData.slideCount === count 
                                  ? '0 0 25px rgba(0, 255, 194, 0.4)'
                                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                                minHeight: '80px'
                              }}
                            >
                              {/* Animated Background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Content */}
                              <div className="relative z-10 p-3 text-center">
                                <div className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                                  formData.slideCount === count 
                                    ? 'text-gray-900' 
                                    : 'text-white'
                                }`}>
                                  {count}
                                </div>
                                <div className={`text-xs font-medium transition-colors duration-300 ${
                                  formData.slideCount === count 
                                    ? 'text-gray-700' 
                                    : 'text-gray-400'
                                }`}>
                                  slides
                                </div>
                              </div>
                              
                              {/* Selection Indicator */}
                              {formData.slideCount === count && (
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                                     style={{ 
                                       background: 'linear-gradient(135deg, #10B981, #059669)',
                                       color: 'white',
                                       boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                                     }}>
                                  ✓
                                </div>
                              )}
                              
                              {/* Hover Glow Effect */}
                              <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                                formData.slideCount === count 
                                  ? 'opacity-100' 
                                  : 'opacity-0 group-hover:opacity-50'
                              }`}
                                   style={{
                                     background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.1), rgba(44, 211, 225, 0.1))',
                                     filter: 'blur(1px)'
                                   }} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Input Option */}
                      <div className="border-t pt-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                              Custom Amount
                            </span>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              Enter any number between 3-50 slides
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="3"
                              max="50"
                              value={formData.slideCount}
                              onChange={(e) => handleInputChange('slideCount', parseInt(e.target.value) || 10)}
                              className="w-20 px-3 py-2 rounded-lg text-center font-bold transition-all duration-300 focus:scale-105"
                              style={{
                                background: 'var(--bg-primary)',
                                border: '2px solid var(--color-cta)',
                                color: 'var(--text-primary)',
                                boxShadow: '0 0 15px rgba(0, 255, 194, 0.2)'
                              }}
                            />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                              slides
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Summary */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl" 
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.1), rgba(44, 211, 225, 0.1))',
                           border: '1px solid rgba(0, 255, 194, 0.3)',
                           boxShadow: '0 4px 16px rgba(0, 255, 194, 0.1)'
                         }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                           style={{ background: 'var(--color-cta)' }}>
                        <span className="text-sm font-bold" style={{ color: 'var(--bg-primary)' }}>
                          📊
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-cta)' }}>
                          {formData.slideCount} Professional Slides
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Premium design with real images & content
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Sources */}
                <div>
                  <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Optional Sources
                  </label>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Upload files or add links to enhance your presentation with additional content
                  </p>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e.target.files)}
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          borderColor: 'rgba(255, 107, 53, 0.3)',
                          background: 'rgba(255, 107, 53, 0.05)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">📁</div>
                          <div className="font-medium">Click to upload files</div>
                          <div className="text-sm">PDF, DOC, TXT, PPT files supported</div>
                        </div>
                      </button>
                    </div>

                    {/* Uploaded Files */}
                    {formData.sources.files.length > 0 && (
                      <div className="space-y-2">
                        {formData.sources.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📄</span>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Link Fields */}
                    <div className="space-y-3">
                      {formData.sources.links.map((link, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => handleLinkChange(index, e.target.value)}
                            placeholder="https://example.com/source"
                            className="flex-1 p-3 rounded-xl transition-all duration-300"
                            style={{
                              background: 'var(--bg-primary)',
                              border: '2px solid rgba(255, 107, 53, 0.2)',
                              color: 'var(--text-primary)'
                            }}
                          />
                          {formData.sources.links.length > 1 && (
                            <button
                              onClick={() => removeLinkField(index)}
                              className="px-4 py-3 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                              style={{ background: 'var(--bg-primary)' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addLinkField}
                        className="text-sm font-medium transition-colors hover:text-orange-300"
                        style={{ color: '#FF6B35' }}
                      >
                        + Add another link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl" style={{ 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444'
              }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generatePresentation}
                disabled={isGenerating}
                className="group relative px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 disabled:scale-100 disabled:opacity-50 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
                  color: 'white',
                  boxShadow: '0 0 40px rgba(255, 107, 53, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">
                  {isGenerating ? 'Generating Presentation...' : 'Generate Presentation'}
                </span>
              </button>
            </div>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-4">
                <div className="w-full rounded-full h-3" style={{ background: 'var(--bg-secondary)' }}>
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${generationProgress}%`,
                      background: 'linear-gradient(90deg, #FF6B35, #FF4500)'
                    }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {generationProgress < 30 ? 'Analyzing content...' :
                     generationProgress < 60 ? 'Generating slides...' :
                     generationProgress < 90 ? 'Creating presentation...' :
                     'Finalizing...'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {Math.round(generationProgress)}% complete
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="text-center space-y-8">
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl" style={{ 
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)'
            }}>
              ✅
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Presentation Generated Successfully!
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Your presentation is ready for download
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={downloadUrl}
                download
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-110 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Download Presentation</span>
              </a>
              <button
                onClick={resetForm}
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-110"
                style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  color: 'var(--text-primary)',
                  border: '2px solid rgba(255, 107, 53, 0.4)',
                  boxShadow: '0 0 20px rgba(255, 107, 53, 0.15)'
                }}
              >
                <span className="group-hover:text-orange-300 transition-colors">Create Another</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 