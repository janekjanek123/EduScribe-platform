'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import emailjs from '@emailjs/browser'
import toast from 'react-hot-toast'

export default function HelpPage() {
  const { t } = useTranslation()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    message: ''
  })

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate form
  const validateForm = () => {
    const newErrors = { email: '', message: '' }
    let isValid = true

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('help.emailRequired')
      isValid = false
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('help.emailInvalid')
      isValid = false
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = t('help.messageRequired')
      isValid = false
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('help.messageMinLength')
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // EmailJS configuration from environment variables
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

      // Check if EmailJS is configured
      if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS not configured. Email would be sent to: support.edzuscribe@gmail.com')
        
        // Simulate sending email
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast.success(t('help.successMessage'))
        
        // Reset form
        setFormData({
          email: '',
          subject: '',
          message: ''
        })
        
        return
      }

      const templateParams = {
        from_email: formData.email,
        subject: formData.subject || 'Support Request',
        message: formData.message,
        to_email: 'support.edzuscribe@gmail.com',
        reply_to: formData.email
      }

      // Send email using EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey)

      toast.success(t('help.successMessage'))
      
      // Reset form
      setFormData({
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(t('help.errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            {t('help.title')}
          </h1>
          <h2 className="text-2xl mb-8" style={{ color: 'var(--color-cta)', textShadow: 'var(--glow-cta)' }}>
            {t('help.subtitle')}
          </h2>
          <p className="max-w-2xl mx-auto leading-relaxed text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('help.welcomeMessage')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-8" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 className="text-2xl font-semibold mb-8" style={{ color: 'var(--text-primary)' }}>
                {t('help.contactForm')}
              </h3>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {t('help.emailLabel')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('help.emailPlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                      errors.email ? 'focus:ring-2 focus:ring-red-500' : 'focus:ring-2 focus:ring-[var(--color-cta)]'
                    }`}
                    style={{
                      background: 'var(--bg-primary)',
                      border: `1px solid ${errors.email ? '#ef4444' : 'var(--bg-tertiary)'}`,
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {t('help.subjectLabel')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('help.subjectPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-[var(--color-cta)]"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {t('help.messageLabel')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('help.messagePlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl transition-all duration-300 resize-vertical ${
                      errors.message ? 'focus:ring-2 focus:ring-red-500' : 'focus:ring-2 focus:ring-[var(--color-cta)]'
                    }`}
                    style={{
                      background: 'var(--bg-primary)',
                      border: `1px solid ${errors.message ? '#ef4444' : 'var(--bg-tertiary)'}`,
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-8 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: isSubmitting ? 'var(--bg-tertiary)' : 'var(--color-cta)',
                      color: isSubmitting ? 'var(--text-muted)' : 'var(--bg-primary)',
                      boxShadow: isSubmitting ? 'none' : 'var(--glow-cta)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? t('help.sending') : t('help.sendButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Help */}
            <div className="rounded-2xl p-6" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('help.quickHelp')}
              </h3>
              <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('help.commonIssues')}
              </p>

              <div className="space-y-6">
                <div className="border-l-4 pl-4" style={{ borderColor: 'var(--color-cta)' }}>
                  <h4 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{t('help.accountIssue')}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('help.accountIssueDesc')}</p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderColor: 'var(--color-file)' }}>
                  <h4 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{t('help.uploadIssue')}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('help.uploadIssueDesc')}</p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderColor: 'var(--color-text)' }}>
                  <h4 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{t('help.noteGeneration')}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('help.noteGenerationDesc')}</p>
                </div>
              </div>
            </div>

            {/* Direct Contact */}
            <div className="rounded-2xl p-6" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '2px solid var(--color-cta)',
              boxShadow: 'var(--glow-cta)'
            }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-cta)', textShadow: 'var(--glow-cta)' }}>
                {t('help.directContact')}
              </h3>
              <div className="space-y-3">
                <p className="text-base font-medium break-words" style={{ color: 'var(--text-primary)' }}>
                  {t('help.emailDirect')}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('help.responseTime')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 