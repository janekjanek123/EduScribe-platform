# EmailJS Setup for EduScribe Support Form

This document explains how to set up EmailJS for the support form functionality in EduScribe.

## Overview

The Help/Support page (`/help`) includes a contact form that sends emails to `support.edzuscribe@gmail.com`. This form uses EmailJS to handle email sending from the client-side.

## Setup Instructions

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account (allows 200 emails/month)
3. Verify your email address

### 2. Configure Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Select Gmail and connect your `support.edzuscribe@gmail.com` account
   - **Other**: Configure SMTP settings for your email provider

### 3. Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template structure:

```
Subject: EduScribe Support Request - {{subject}}

From: {{from_email}}
Subject: {{subject}}

Message:
{{message}}

---
Reply to: {{reply_to}}
Sent via EduScribe Support Form
```

4. Set the template variables:
   - `from_email`: User's email address
   - `subject`: Subject from the form
   - `message`: User's message
   - `reply_to`: User's email for replies

### 4. Get Configuration Values

1. **Service ID**: From Email Services page
2. **Template ID**: From Email Templates page  
3. **Public Key**: From Account → API Keys page

### 5. Environment Configuration

Add these variables to your `.env.local` file:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Testing

1. After configuration, test the form on `/help`
2. Fill out the form and submit
3. Check that emails arrive at `support.edzuscribe@gmail.com`
4. Verify the reply-to address is set correctly

## Fallback Behavior

If EmailJS is not configured (environment variables missing), the form will:
- Still validate and accept submissions
- Show success message to users
- Log a warning in the console
- Not actually send emails

## Security Notes

- EmailJS public key is safe to expose in client-side code
- The service only allows sending to pre-configured email addresses
- Rate limiting is handled by EmailJS (200 emails/month on free plan)

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check service configuration and API keys
2. **Wrong sender**: Verify the email service connection
3. **Template errors**: Ensure all template variables are properly mapped
4. **Rate limits**: Upgrade EmailJS plan if needed

### Alternative Services

If you prefer a different email service:
- **SendGrid**: Requires backend API
- **Nodemailer**: Server-side only
- **Resend**: Modern alternative to EmailJS

## Cost Considerations

- **Free tier**: 200 emails/month
- **Paid plans**: Start at $20/month for 2,000 emails
- Monitor usage in EmailJS dashboard

---

For questions about this setup, contact the development team. 