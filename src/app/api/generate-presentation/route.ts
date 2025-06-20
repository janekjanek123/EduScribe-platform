import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import PptxGenJS from 'pptxgenjs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface SlideContent {
  title: string
  content: string[]
  slideType: 'title' | 'content' | 'image' | 'chart' | 'conclusion'
  visualSuggestion?: string
  imageQuery?: string
}

interface PresentationData {
  title: string
  subtitle?: string
  description: string
  slideCount: number
  slides: SlideContent[]
}

// Image fetching function using Unsplash API
async function fetchHighQualityImage(query: string): Promise<string | null> {
  try {
    // Using Unsplash Source API for high-quality images
    const searchQuery = encodeURIComponent(query.replace(/[^a-zA-Z0-9\s]/g, '').trim())
    const imageUrl = `https://source.unsplash.com/1200x800/?${searchQuery}`
    
    // Test if image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' })
    if (response.ok) {
      return imageUrl
    }
    
    // Fallback to more generic terms
    const fallbackQueries = ['business', 'professional', 'technology', 'modern', 'corporate']
    for (const fallback of fallbackQueries) {
      const fallbackUrl = `https://source.unsplash.com/1200x800/?${fallback}`
      const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' })
      if (fallbackResponse.ok) {
        return fallbackUrl
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
}

// Enhanced AI prompt for premium content generation
const generateEnhancedPrompt = (title: string, description: string, slideCount: number, additionalContext: string) => `
Create an exceptional, premium-quality presentation for "${title}" that rivals presentations from top consulting firms like McKinsey, BCG, or Deloitte.

Description: ${description}
Number of slides needed: ${slideCount}
${additionalContext}

PREMIUM CONTENT STANDARDS:
- Generate rich, detailed, substantive content with real informational value
- Use sophisticated business language with precise terminology and industry insights
- Include specific data points, statistics, case studies, and actionable recommendations
- Create compelling narratives that build logical arguments and drive conclusions
- Avoid generic phrases, filler content, or meaningless bullet points
- Every sentence must provide genuine value and demonstrate expertise

VISUAL INTEGRATION REQUIREMENTS:
- Each slide MUST include a specific image search query for high-quality stock photos
- Suggest professional imagery that directly supports and enhances the content
- Recommend specific visual elements: charts, infographics, diagrams, or conceptual images
- Ensure perfect balance between text content and visual elements
- Consider data visualizations, process flows, and strategic frameworks

CONTENT DEPTH REQUIREMENTS:
- Title slide: Compelling value proposition with strategic context
- Content slides: 5-7 detailed bullet points with specific insights, examples, and implications
- Each bullet point should be 15-25 words with concrete information
- Include quantitative data, industry benchmarks, or research findings where relevant
- Conclusion slide: Clear action items with measurable outcomes and next steps

PROFESSIONAL STRUCTURE:
1. Executive title slide with strategic positioning
2. ${slideCount - 2} content slides with thematic progression and supporting evidence
3. Strategic conclusion with actionable roadmap

Return response in this exact JSON format:
{
  "title": "Executive-Level Professional Title",
  "subtitle": "Strategic value proposition or key business insight",
  "slides": [
    {
      "title": "Clear, Value-Driven Slide Title That Communicates Specific Benefit",
      "content": [
        "Detailed bullet point with specific metrics, data, or concrete examples that demonstrate expertise",
        "Strategic insight with supporting evidence, industry benchmarks, or research findings",
        "Actionable recommendation with clear implementation steps and expected outcomes",
        "Data-driven conclusion with measurable impact and business value proposition",
        "Additional substantive point with real-world applications and success factors"
      ],
      "slideType": "title|content|conclusion",
      "visualSuggestion": "Specific chart type, infographic concept, or data visualization recommendation",
      "imageQuery": "specific professional image search terms for high-quality stock photo"
    }
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const slideCount = parseInt(formData.get('slideCount') as string)
    const linksJson = formData.get('links') as string
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Parse links
    let links: string[] = []
    try {
      links = JSON.parse(linksJson || '[]')
    } catch (e) {
      links = []
    }

    // Process uploaded files (for now, we'll just get their names and types)
    const files: { name: string; type: string; size: number }[] = []
    const entries = Array.from(formData.entries())
    for (const [key, value] of entries) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push({
          name: value.name,
          type: value.type,
          size: value.size
        })
      }
    }

    // Generate presentation content using AI
    const presentationData = await generatePresentationContent(
      title,
      description,
      slideCount,
      files,
      links
    )

    // Create PPTX file
    const fileName = await createPresentationFile(presentationData)
    
    // Return download URL
    const downloadUrl = `/api/download-presentation/${fileName}`
    
    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName,
      slideCount: presentationData.slides.length
    })

  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presentation. Please try again.' },
      { status: 500 }
    )
  }
}

async function generatePresentationContent(
  title: string,
  description: string,
  slideCount: number,
  files: { name: string; type: string; size: number }[],
  links: string[]
): Promise<PresentationData> {
  
  // Create context from additional sources
  let additionalContext = ''
  if (files.length > 0) {
    additionalContext += `\nAdditional files provided: ${files.map(f => f.name).join(', ')}`
  }
  if (links.length > 0) {
    additionalContext += `\nReference links: ${links.join(', ')}`
  }

  const prompt = generateEnhancedPrompt(title, description, slideCount, additionalContext)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an elite presentation design consultant and strategic communication expert with 15+ years of experience creating executive-level presentations for Fortune 500 companies and top-tier academic institutions. Your presentations are known for their visual sophistication, compelling narratives, and actionable insights. You excel at transforming complex concepts into clear, engaging, and professionally designed slide content. Every presentation you create looks like it was designed by a world-class design agency and contains content worthy of boardroom presentations. You always include specific visual recommendations and ensure perfect balance between text and visual elements. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('No content generated')
    }

    // Parse the AI response
    let aiResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        aiResponse = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback to manual content generation
      aiResponse = generateFallbackContent(title, description, slideCount)
    }

    return {
      title: aiResponse.title || title,
      subtitle: aiResponse.subtitle,
      description,
      slideCount,
      slides: aiResponse.slides || []
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback to manual content generation
    const fallbackContent = generateFallbackContent(title, description, slideCount)
    return {
      title,
      subtitle: fallbackContent.subtitle,
      description,
      slideCount,
      slides: fallbackContent.slides
    }
  }
}

function generateFallbackContent(title: string, description: string, slideCount: number) {
  const slides: SlideContent[] = []
  
  // Professional slide themes and visual suggestions
  const contentThemes = [
    { title: "Executive Overview & Strategic Context", visual: "Executive dashboard with key metrics and KPIs" },
    { title: "Market Analysis & Competitive Landscape", visual: "Market share pie chart and competitive positioning matrix" },
    { title: "Strategic Opportunities & Growth Drivers", visual: "Growth trajectory chart and opportunity mapping diagram" },
    { title: "Implementation Framework & Methodology", visual: "Process flow diagram and implementation timeline" },
    { title: "Performance Metrics & Success Indicators", visual: "Performance dashboard with progress indicators" },
    { title: "Risk Assessment & Mitigation Strategies", visual: "Risk matrix and mitigation strategy infographic" },
    { title: "Resource Allocation & Investment Strategy", visual: "Resource allocation chart and investment breakdown" },
    { title: "Stakeholder Impact & Change Management", visual: "Stakeholder mapping and change impact assessment" }
  ]
  
  // Title slide with enhanced content
  slides.push({
    title: title,
    content: [
      description,
      "Executive-Level Strategic Presentation",
      `Comprehensive Analysis & Recommendations`,
      `Generated: ${new Date().toLocaleDateString()}`
    ],
    slideType: 'title',
    visualSuggestion: "Professional title slide with corporate branding, subtle background graphics, and executive summary visual"
  })

  // Dynamic content slides with professional themes
  for (let i = 2; i < slideCount; i++) {
    const themeIndex = (i - 2) % contentThemes.length
    const theme = contentThemes[themeIndex]
    
    slides.push({
      title: theme.title,
      content: [
        "Comprehensive data-driven analysis with quantitative insights",
        "Strategic recommendations based on industry best practices",
        "Evidence-based conclusions supported by market research",
        "Actionable implementation steps with measurable outcomes",
        "Risk mitigation strategies and contingency planning",
        "ROI projections and performance benchmarking"
      ],
      slideType: 'content',
      visualSuggestion: theme.visual
    })
  }

  // Enhanced conclusion slide
  slides.push({
    title: "Executive Summary & Strategic Roadmap",
    content: [
      "Key strategic insights and critical success factors",
      "Prioritized action items with clear ownership and timelines",
      "Expected outcomes and measurable business impact",
      "Next phase planning and milestone tracking",
      "Executive decision points and approval requirements"
    ],
    slideType: 'conclusion',
    visualSuggestion: "Executive summary infographic with roadmap timeline and call-to-action elements"
  })

  return { 
    slides,
    subtitle: "Strategic Analysis & Executive Recommendations"
  }
}

async function createPresentationFile(presentationData: PresentationData): Promise<string> {
  const pptx = new PptxGenJS()
  
  // Set presentation properties
  pptx.author = 'EduScribe AI'
  pptx.company = 'EduScribe'
  pptx.title = presentationData.title
  pptx.subject = presentationData.description

  // Professional EduScribe color palette with enhanced design elements
  const colors = {
    primary: '#1F2235',      // EduScribe dark blue
    secondary: '#2A2F47',    // Medium blue
    tertiary: '#343A56',     // Darker accent
    accent: '#00FFC2',       // EduScribe cyan
    text: '#FFFFFF',         // White text
    textSecondary: '#B8C4D9', // Light blue-gray
    textMuted: '#8B94A8',    // Muted gray
    gradient1: '#2CD3E1',    // YouTube blue
    gradient2: '#8AD4FF',    // File blue
    gradient3: '#A020F0',    // Purple accent
    backgroundOverlay: '#1A1D2E', // Subtle overlay
    cardBackground: '#252B42',    // Card backgrounds
    shadowColor: '#000000'        // Shadow effects
  }

  // Professional typography settings
  const fonts = {
    title: 'Segoe UI',
    body: 'Segoe UI',
    accent: 'Segoe UI Semibold'
  }

  // Create slides with professional design standards
  presentationData.slides.forEach((slideData, index) => {
    const slide = pptx.addSlide()

    // Professional multi-layer background design
    // Base gradient background
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { type: 'gradient', 
        colors: [
          { color: colors.primary, position: 0 },
          { color: colors.secondary, position: 50 },
          { color: colors.tertiary, position: 100 }
        ],
        angle: 135
      }
    })

    // Subtle texture overlay for depth
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: colors.backgroundOverlay, transparency: 85 }
    })

    // Decorative geometric elements for visual interest
    slide.addShape('circle', {
      x: -1, y: -1, w: 3, h: 3,
      fill: { color: colors.accent, transparency: 90 }
    })

    slide.addShape('circle', {
      x: 8.5, y: 4, w: 2.5, h: 2.5,
      fill: { color: colors.gradient1, transparency: 92 }
    })

    if (slideData.slideType === 'title') {
      // Professional title slide with enhanced visual design
      
      // Elegant header with sophisticated gradient
      slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 0.4,
        fill: { type: 'gradient',
          colors: [
            { color: colors.accent, position: 0 },
            { color: colors.gradient1, position: 50 },
            { color: colors.gradient2, position: 100 }
          ]
        }
      })

      // Central content card with shadow effect
      slide.addShape('rect', {
        x: 1, y: 1.2, w: 8, h: 3.5,
        fill: { color: colors.cardBackground, transparency: 20 },
        line: { color: colors.accent, width: 1 }
      })

      // Main title with professional typography and shadow
      slide.addText(slideData.title, {
        x: 1.2, y: 1.6, w: 7.6, h: 1.2,
        fontSize: 44,
        fontFace: fonts.title,
        color: colors.text,
        bold: true,
        align: 'center'
      })

      // Subtitle with accent styling
      if (presentationData.subtitle) {
        slide.addText(presentationData.subtitle, {
          x: 1.2, y: 2.8, w: 7.6, h: 0.6,
          fontSize: 22,
          fontFace: fonts.body,
          color: colors.accent,
          align: 'center'
        })
      }

      // Content with professional bullet points
      slideData.content.forEach((line, lineIndex) => {
        const startY = presentationData.subtitle ? 3.6 : 3.2
        
        // Professional bullet point
        slide.addShape('circle', {
          x: 1.8, y: startY + (lineIndex * 0.35) + 0.1, w: 0.08, h: 0.08,
          fill: colors.accent
        })

        slide.addText(line, {
          x: 2, y: startY + (lineIndex * 0.35), w: 6.8, h: 0.3,
          fontSize: 14,
          fontFace: fonts.body,
          color: colors.textSecondary,
          align: 'left'
        })
      })

      // Decorative visual elements
      slide.addShape('circle', {
        x: 4.4, y: 0.5, w: 1.2, h: 1.2,
        fill: { color: colors.accent, transparency: 80 }
      })

      // Professional icon placeholder
      slide.addText('🎯', {
        x: 4.7, y: 0.8, w: 0.6, h: 0.6,
        fontSize: 32,
        align: 'center'
      })

    } else if (slideData.slideType === 'conclusion') {
      // Professional conclusion slide with enhanced visual impact
      
      // Sophisticated gradient header
      slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 1,
        fill: { type: 'gradient',
          colors: [
            { color: colors.accent, position: 0 },
            { color: colors.gradient2, position: 50 },
            { color: colors.gradient3, position: 100 }
          ]
        }
      })

      // Professional content card
      slide.addShape('rect', {
        x: 0.5, y: 1.2, w: 9, h: 3.8,
        fill: { color: colors.cardBackground, transparency: 15 },
        line: { color: colors.accent, width: 1 }
      })

      // Conclusion title with enhanced typography
      slide.addText(slideData.title, {
        x: 0.7, y: 0.2, w: 8.6, h: 0.6,
        fontSize: 32,
        fontFace: fonts.accent,
        color: colors.primary,
        bold: true,
        align: 'center'
      })

      // Professional summary icon
      slide.addText('✨', {
        x: 4.7, y: 1.4, w: 0.6, h: 0.6,
        fontSize: 36,
        align: 'center'
      })

      // Content with enhanced professional styling
      slideData.content.forEach((point, pointIndex) => {
        // Sophisticated bullet design
        slide.addShape('rect', {
          x: 1, y: 2.2 + (pointIndex * 0.55), w: 0.12, h: 0.12,
          fill: { type: 'gradient',
            colors: [
              { color: colors.accent, position: 0 },
              { color: colors.gradient1, position: 100 }
            ]
          }
        })

        slide.addText(point, {
          x: 1.3, y: 2.15 + (pointIndex * 0.55), w: 7.9, h: 0.5,
          fontSize: 17,
          fontFace: fonts.body,
          color: colors.text,
          lineSpacing: 26
        })
      })

      // Call-to-action visual element
      slide.addShape('rect', {
        x: 7.5, y: 4.5, w: 1.8, h: 0.6,
        fill: { color: colors.accent, transparency: 20 },
        line: { color: colors.accent, width: 1 }
      })

      slide.addText('Next Steps', {
        x: 7.6, y: 4.6, w: 1.6, h: 0.4,
        fontSize: 12,
        fontFace: fonts.accent,
        color: colors.accent,
        bold: true,
        align: 'center'
      })

    } else {
      // Professional content slide with enhanced visual design
      
      // Sophisticated header with multi-layer gradient
      slide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 1.1,
        fill: { type: 'gradient',
          colors: [
            { color: colors.secondary, position: 0 },
            { color: colors.primary, position: 70 },
            { color: colors.tertiary, position: 100 }
          ]
        }
      })

      // Professional content area with card design
      slide.addShape('rect', {
        x: 0.4, y: 1.3, w: 6, h: 3.5,
        fill: { color: colors.cardBackground, transparency: 10 },
        line: { color: colors.accent, width: 1 }
      })

      // Content title with enhanced styling
      slide.addShape('rect', {
        x: 0.5, y: 0.9, w: 4, h: 0.08,
        fill: { type: 'gradient',
          colors: [
            { color: colors.accent, position: 0 },
            { color: colors.gradient1, position: 100 }
          ]
        }
      })

      slide.addText(slideData.title, {
        x: 0.5, y: 0.25, w: 9, h: 0.6,
        fontSize: 30,
        fontFace: fonts.accent,
        color: colors.text,
        bold: true
      })

      // Professional content with enhanced bullet points
      slideData.content.forEach((point, pointIndex) => {
        // Sophisticated bullet design with gradient
        slide.addShape('circle', {
          x: 0.7, y: 1.6 + (pointIndex * 0.6), w: 0.12, h: 0.12,
          fill: { type: 'gradient',
            colors: [
              { color: colors.accent, position: 0 },
              { color: colors.gradient2, position: 100 }
            ]
          }
        })

        slide.addText(point, {
          x: 0.95, y: 1.55 + (pointIndex * 0.6), w: 5.3, h: 0.55,
          fontSize: 16,
          fontFace: fonts.body,
          color: colors.text,
          lineSpacing: 24
        })
      })

      // Enhanced visual element area with professional design
      slide.addShape('rect', {
        x: 6.8, y: 1.3, w: 2.8, h: 3.5,
        fill: { color: colors.cardBackground, transparency: 20 },
        line: { color: colors.gradient1, width: 2 }
      })

      // Visual content based on slide topic
      const visualIcons = ['📊', '💡', '🎯', '📈', '⚡', '🔍', '💼', '🌟']
      const randomIcon = visualIcons[index % visualIcons.length]
      
      slide.addText(randomIcon, {
        x: 7.6, y: 2.2, w: 1.2, h: 1.2,
        fontSize: 48,
        align: 'center'
      })

      // Visual suggestion label
      if (slideData.visualSuggestion) {
        slide.addText('Visual Element', {
          x: 6.9, y: 3.8, w: 2.6, h: 0.3,
          fontSize: 10,
          fontFace: fonts.body,
          color: colors.textMuted,
          align: 'center'
        })

        slide.addText(slideData.visualSuggestion, {
          x: 6.9, y: 4.1, w: 2.6, h: 0.6,
          fontSize: 9,
          fontFace: fonts.body,
          color: colors.textSecondary,
          align: 'center'
        })
      }
    }

    // Modern footer with branding
    slide.addShape('rect', {
      x: 0, y: 5.3, w: 10, h: 0.325,
      fill: colors.primary
    })

    // EduScribe branding
    slide.addText('EduScribe AI', {
      x: 0.3, y: 5.35, w: 2, h: 0.225,
      fontSize: 12,
      fontFace: fonts.accent,
      color: colors.accent,
      bold: true
    })

    // Aesthetic slide numbering with modern design
    // Create a stylish rounded background for slide number
    slide.addShape('rect', {
      x: 8.2, y: 5.32, w: 1.6, h: 0.285,
      fill: { type: 'gradient',
        colors: [
          { color: colors.accent, position: 0 },
          { color: colors.gradient1, position: 100 }
        ]
      }
    })

    // Add a subtle inner shadow effect with darker overlay
    slide.addShape('rect', {
      x: 8.25, y: 5.34, w: 1.5, h: 0.245,
      fill: { color: colors.secondary, transparency: 30 }
    })

    // Current slide number (larger, bold)
    slide.addText(`${index + 1}`, {
      x: 8.3, y: 5.345, w: 0.6, h: 0.235,
      fontSize: 16,
      fontFace: fonts.accent,
      color: colors.primary,
      bold: true,
      align: 'center'
    })

    // Separator with style
    slide.addText('•', {
      x: 8.9, y: 5.345, w: 0.2, h: 0.235,
      fontSize: 14,
      fontFace: fonts.body,
      color: colors.primary,
      align: 'center'
    })

    // Total slides (smaller, elegant)
    slide.addText(`${presentationData.slides.length}`, {
      x: 9.1, y: 5.345, w: 0.6, h: 0.235,
      fontSize: 12,
      fontFace: fonts.body,
      color: colors.primary,
      align: 'center'
    })

    // Add a small decorative accent dot
    slide.addShape('circle', {
      x: 9.85, y: 5.42, w: 0.08, h: 0.08,
      fill: colors.primary
    })
  })

  // Add professional slide transitions and animations
  pptx.slides.forEach((slide, slideIndex) => {
    // Set slide transition effects
    slide.transition = {
      type: 'fade',
      duration: 800,
      advance: false
    }
    
    // Add entrance animations for slide elements
    // Note: PptxGenJS has limited animation support, but we set up the foundation
    // for future enhancement with more sophisticated animation libraries
  })

  // Set presentation-wide properties for professional output
  pptx.slideSize = { width: 10, height: 5.625 } // 16:9 aspect ratio
  pptx.rtlMode = false
  
  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'presentations')
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `presentation_${timestamp}.pptx`
  const filePath = join(uploadsDir, fileName)

  // Write the presentation file
  const pptxBuffer = await pptx.write('nodebuffer') as Buffer
  await writeFile(filePath, pptxBuffer)

  return fileName
}