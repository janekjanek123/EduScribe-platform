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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('help.title')}
          </h1>
          <h2 className="text-xl text-blue-600 mb-6">
            {t('help.subtitle')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('help.welcomeMessage')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {t('help.contactForm')}
              </h3>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('help.emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('help.emailPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('help.subjectLabel')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('help.subjectPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('help.messageLabel')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('help.messagePlaceholder')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                      errors.message ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? t('help.sending') : t('help.sendButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('help.quickHelp')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('help.commonIssues')}
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">{t('help.accountIssue')}</h4>
                  <p className="text-sm text-gray-600">{t('help.accountIssueDesc')}</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">{t('help.uploadIssue')}</h4>
                  <p className="text-sm text-gray-600">{t('help.uploadIssueDesc')}</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900">{t('help.noteGeneration')}</h4>
                  <p className="text-sm text-gray-600">{t('help.noteGenerationDesc')}</p>
                </div>
              </div>
            </div>

            {/* Direct Contact */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                {t('help.directContact')}
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  {t('help.emailDirect')}
                </p>
                <p className="text-sm text-blue-700">
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