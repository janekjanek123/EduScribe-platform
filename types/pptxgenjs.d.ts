declare module 'pptxgenjs' {
  interface TextOptions {
    x?: number
    y?: number
    w?: number
    h?: number
    fontSize?: number
    fontFace?: string
    color?: string
    bold?: boolean
    align?: 'left' | 'center' | 'right'
    lineSpacing?: number
  }

  interface ShapeOptions {
    x?: number
    y?: number
    w?: number
    h?: number
    fill?: string | { 
      type?: 'gradient'
      colors?: Array<{ color: string; position: number }>
      angle?: number
      color?: string
      transparency?: number
    }
    line?: {
      color?: string
      width?: number
      dashType?: string
    }
  }

  interface Slide {
    addText(text: string, options?: TextOptions): void
    addShape(shape: string, options?: ShapeOptions): void
  }

  class PptxGenJS {
    author: string
    company: string
    title: string
    subject: string
    
    addSlide(): Slide
    write(format: 'nodebuffer'): Promise<Buffer>
  }

  export = PptxGenJS
} 