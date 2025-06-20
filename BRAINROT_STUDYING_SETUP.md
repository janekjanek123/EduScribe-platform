# 🔥 Brainrot Studying System - Setup & Integration Guide

## 📋 Overview
The Brainrot Studying system transforms educational content into engaging, TikTok-style learning videos. This guide covers setup, asset organization, and future integrations.

## 🚀 Quick Start

### 1. System Requirements
```bash
# Node.js 18+ required
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

### 2. Current Setup
The system is already integrated into the Eduscribe platform:
- **Frontend**: `/src/app/brainrot-studying/page.tsx`
- **API**: `/src/app/api/generate-brainrot/route.ts`
- **Placeholder Assets**: `/src/app/api/placeholder/[...path]/route.ts`

### 3. Running the System
```bash
# Development server (already configured)
npm run dev

# The brainrot studying tool is available at:
# http://localhost:3003/brainrot-studying
```

## 📁 File Structure & Organization

### Current Structure
```
src/
├── app/
│   ├── brainrot-studying/
│   │   └── page.tsx                 # Main interface
│   └── api/
│       ├── generate-brainrot/
│       │   └── route.ts            # Generation API
│       └── placeholder/
│           └── [...path]/route.ts  # Mock assets
├── assets/                         # (Create this directory)
│   ├── backgrounds/               # Video backgrounds
│   ├── avatars/                  # Avatar assets
│   ├── audio/                    # Audio templates
│   └── fonts/                    # Custom fonts
└── lib/                          # (Create this directory)
    ├── file-processors/          # Document parsing
    ├── video-generation/         # Video composition
    └── ai-integrations/          # AI service clients
```

### 🎬 Asset Organization

#### Video Backgrounds (`/assets/backgrounds/`)
```
backgrounds/
├── minecraft/
│   ├── minecraft-parkour.mp4     # Main background video
│   ├── thumbnail.jpg             # Preview thumbnail
│   └── config.json               # Background settings
├── subway/
│   ├── subway-surfers.mp4
│   ├── thumbnail.jpg
│   └── config.json
└── satisfying/
    ├── satisfying-visuals.mp4
    ├── thumbnail.jpg
    └── config.json
```

**Background Config Example:**
```json
{
  "id": "minecraft",
  "name": "Minecraft Parkour",
  "duration": 300,
  "loopable": true,
  "aspectRatio": "9:16",
  "resolution": "1080x1920",
  "framerate": 30
}
```

#### Avatar Assets (`/assets/avatars/`)
```
avatars/
├── default/
│   ├── idle.mp4              # Idle animation
│   ├── talking.mp4           # Talking animation
│   ├── excited.mp4           # Excited gesture
│   ├── explaining.mp4        # Explaining gesture
│   └── config.json           # Avatar settings
└── future-avatars/
    └── (additional avatar sets)
```

**Avatar Config Example:**
```json
{
  "id": "default",
  "name": "Default Avatar",
  "animations": {
    "idle": "idle.mp4",
    "talking": "talking.mp4",
    "excited": "excited.mp4",
    "explaining": "explaining.mp4"
  },
  "position": {
    "x": "center",
    "y": "bottom-third"
  }
}
```

## 🔧 Development Setup

### 1. Install Required Packages
```bash
# Document processing
npm install pdf-parse mammoth

# Video processing (when ready)
npm install fluent-ffmpeg
npm install @ffmpeg-installer/ffmpeg

# AI integrations (when ready)
npm install openai
# ElevenLabs client will be added when available
```

### 2. Environment Variables
Create or update `.env.local`:
```env
# AI Services
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads

# Video Generation
FFMPEG_PATH=/usr/local/bin/ffmpeg
OUTPUT_DIR=./generated-videos

# Development
NEXT_PUBLIC_API_URL=http://localhost:3003
```

### 3. Create Required Directories
```bash
mkdir -p assets/{backgrounds,avatars,audio,fonts}
mkdir -p lib/{file-processors,video-generation,ai-integrations}
mkdir -p uploads
mkdir -p generated-videos
```

## 🤖 AI Integration Setup

### 1. ElevenLabs Voice Generation
```typescript
// lib/ai-integrations/elevenlabs.ts
export class ElevenLabsClient {
  private apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async generateVoice(text: string, voiceId: string = 'default'): Promise<Buffer> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })
    
    return Buffer.from(await response.arrayBuffer())
  }
}
```

### 2. OpenAI Script Generation
```typescript
// lib/ai-integrations/openai.ts
export class BrainrotScriptGenerator {
  private client: OpenAI
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }
  
  async generateScript(topic: string, content: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a Gen-Z content creator who makes educational TikTok videos. Create engaging, trendy scripts that make learning fun using current slang and memes."
      }, {
        role: "user", 
        content: `Topic: ${topic}\nContent: ${content}\n\nCreate a 60-90 second brainrot-style educational script.`
      }],
      temperature: 0.8
    })
    
    return response.choices[0].message.content || ''
  }
}
```

## 📄 Document Processing Integration

### 1. Install Document Processors
```bash
npm install pdf-parse mammoth officegen
```

### 2. Update File Extraction Function
Replace the placeholder in `/src/app/api/generate-brainrot/route.ts`:

```typescript
// Add imports at the top
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

// Replace the extractTextFromFile function
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  try {
    if (file.type === 'text/plain') {
      return buffer.toString('utf-8')
    }
    
    if (file.type === 'application/pdf') {
      const data = await pdfParse(buffer)
      return data.text
    }
    
    if (file.type.includes('word') || file.type.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    
    // PowerPoint extraction is more complex - implement as needed
    if (file.type.includes('presentation')) {
      return '[PowerPoint extraction - implement with officegen or similar]'
    }
    
    return `[Unsupported file type: ${file.type}]`
    
  } catch (error) {
    console.error('File extraction error:', error)
    throw new Error(`Failed to extract text from ${file.name}`)
  }
}
```

## 🎥 Video Generation Integration

### 1. Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows (use chocolatey)
choco install ffmpeg
```

### 2. Video Composition Service
```typescript
// lib/video-generation/composer.ts
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

export class VideoComposer {
  async composeVideo({
    background,
    avatar,
    voiceover,
    script,
    outputPath
  }: {
    background: string
    avatar: string
    voiceover: string
    script: string
    outputPath: string
  }): Promise<string> {
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(background)                    // Background video
        .input(avatar)                        // Avatar animation
        .input(voiceover)                     // Audio track
        .complexFilter([
          // Overlay avatar on background
          '[0:v][1:v]overlay=W/2-w/2:H-h-50[overlaid]',
          // Add text overlays for script
          `[overlaid]drawtext=text='${script}':fontfile=arial.ttf:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-th-100`
        ])
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-shortest',
          '-r 30'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run()
    })
  }
  
  async addWatermark(videoPath: string, watermarkText: string): Promise<string> {
    const outputPath = videoPath.replace('.mp4', '_watermarked.mp4')
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .complexFilter([
          `drawtext=text='${watermarkText}':fontcolor=white@0.8:fontsize=24:x=w-tw-10:y=h-th-10`
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run()
    })
  }
}
```

## 🔄 Integration Workflow

### 1. Complete API Implementation
Replace placeholders in `/src/app/api/generate-brainrot/route.ts`:

```typescript
// Uncomment and implement the actual generation logic
const contentToUse = extractedText || description
const script = await generateBrainrotScript(topic, contentToUse)
const voiceUrl = await generateVoiceover(script)
const videoUrl = await composeVideo({
  background: videoBackground,
  avatar: avatar,
  voiceover: voiceUrl,
  script: script
})
const finalVideoUrl = await addWatermark(videoUrl, 'Eduscribe.ai')

return NextResponse.json({
  success: true,
  videoUrl: finalVideoUrl,
  thumbnailUrl: await generateThumbnail(finalVideoUrl),
  videoId: generateVideoId()
})
```

### 2. Asset Pipeline
1. **Upload backgrounds** to `/assets/backgrounds/`
2. **Configure avatar animations** in `/assets/avatars/`
3. **Test with sample files** using the upload interface
4. **Monitor generation logs** for debugging

### 3. Production Deployment
```bash
# Build for production
npm run build

# Set production environment variables
# Deploy assets to CDN (recommended)
# Configure file upload limits on server
```

## 📊 Monitoring & Analytics

### 1. Add Logging
```typescript
// lib/monitoring/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  }
}
```

### 2. Performance Metrics
- File upload time
- Text extraction duration
- Video generation time
- Total processing duration

## 🚨 Important Notes

### Security Considerations
- **File validation**: Already implemented (file type, size limits)
- **Input sanitization**: Sanitize extracted text before processing
- **Rate limiting**: Add rate limiting for API endpoints
- **File cleanup**: Clean up temporary files after processing

### Scalability
- **Queue system**: Consider adding Redis/Bull for video processing queue
- **Cloud storage**: Move generated videos to AWS S3 or similar
- **CDN**: Serve backgrounds and avatars from CDN
- **Database**: Store video metadata in database

### Error Handling
- **File corruption**: Handle corrupt file uploads gracefully
- **Generation failures**: Provide meaningful error messages
- **Timeout handling**: Set appropriate timeouts for long operations

## 🧪 Testing

### Test Files
Create test documents in `/test-files/`:
- `sample.pdf` - PDF with extractable text
- `sample.docx` - Word document
- `sample.txt` - Plain text file
- `sample.pptx` - PowerPoint presentation

### Manual Testing Checklist
- [ ] File upload (all supported formats)
- [ ] Text extraction verification
- [ ] Background selection
- [ ] Avatar selection
- [ ] Video generation (placeholder)
- [ ] Error handling
- [ ] Mobile responsiveness

## 🔮 Future Enhancements

### Planned Features
1. **Multiple avatar options**
2. **Custom background uploads**
3. **Voice selection (different personalities)**
4. **Video length options (30s, 60s, 90s)**
5. **Batch processing**
6. **Social media optimization**
7. **Analytics dashboard**

### Integration Roadmap
1. **Phase 1**: Document processing ✅
2. **Phase 2**: Voice generation (ElevenLabs)
3. **Phase 3**: Video composition (FFmpeg)
4. **Phase 4**: Advanced avatars
5. **Phase 5**: Production optimization

---

## 🤝 Contributing

When adding new features:
1. **Keep it modular** - separate concerns into different files
2. **Add comprehensive error handling**
3. **Include TypeScript types**
4. **Document new environment variables**
5. **Update this guide with new setup steps**

## 📞 Support

For questions about integration:
- Check the TODO comments in the code
- Review the placeholder implementations
- Test with sample files first
- Monitor console logs for debugging

The system is designed to be **modular** and **easily extensible** - each component can be developed and tested independently! 