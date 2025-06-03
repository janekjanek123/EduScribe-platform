/**
 * File Text Extraction Service
 * 
 * Handles text extraction from various file types including:
 * - PowerPoint presentations (.pptx, .ppt)
 * - PDF files
 * - Word documents (.docx, .doc)
 * - Text files (.txt, .md, .csv)
 */

import * as yauzl from 'yauzl';
import * as xml2js from 'xml2js';

export interface ExtractedContent {
  text: string;
  slideCount?: number;
  slideTitles?: string[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text content from PowerPoint presentations using ZIP parsing
 */
export async function extractTextFromPowerPoint(fileBuffer: ArrayBuffer, fileName: string): Promise<ExtractedContent> {
  try {
    console.log(`[File Extraction] Extracting text from PowerPoint: ${fileName}`);
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(fileBuffer);
    
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open PowerPoint file: ${err.message}`));
          return;
        }

        const slideTexts: string[] = [];
        const slideTitles: string[] = [];
        let slideCount = 0;
        let processedSlides = 0;
        let totalSlides = 0;

        // First, count the total number of slides
        zipfile.on('entry', (entry) => {
          if (entry.fileName.match(/^ppt\/slides\/slide\d+\.xml$/)) {
            totalSlides++;
          }
        });

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          // Look for slide XML files
          if (entry.fileName.match(/^ppt\/slides\/slide\d+\.xml$/)) {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                console.warn(`[File Extraction] Failed to read slide ${entry.fileName}:`, err.message);
                processedSlides++;
                if (processedSlides === totalSlides) {
                  finishExtraction();
                }
                zipfile.readEntry();
                return;
              }

              let xmlData = '';
              readStream.on('data', (chunk) => {
                xmlData += chunk.toString();
              });

              readStream.on('end', () => {
                // Parse XML and extract text
                xml2js.parseString(xmlData, (err, result) => {
                  if (err) {
                    console.warn(`[File Extraction] Failed to parse XML for ${entry.fileName}:`, err.message);
                  } else {
                    const slideText = extractTextFromSlideXML(result);
                    const slideNumber = parseInt(entry.fileName.match(/slide(\d+)\.xml$/)?.[1] || '0');
                    
                    slideTexts[slideNumber - 1] = slideText.text;
                    slideTitles[slideNumber - 1] = slideText.title || `Slide ${slideNumber}`;
                    slideCount = Math.max(slideCount, slideNumber);
                  }

                  processedSlides++;
                  if (processedSlides === totalSlides) {
                    finishExtraction();
                  }
                });
                zipfile.readEntry();
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          if (totalSlides === 0) {
            finishExtraction();
          }
        });

        function finishExtraction() {
          let extractedText = '';
          
          // Combine all slide texts
          for (let i = 0; i < slideCount; i++) {
            const slideTitle = slideTitles[i] || `Slide ${i + 1}`;
            const slideText = slideTexts[i] || '';
            
            if (slideText.trim()) {
              extractedText += `\n## ${slideTitle}\n\n${slideText.trim()}\n`;
            }
          }

          if (!extractedText.trim()) {
            extractedText = `No text content found in PowerPoint file: ${fileName}`;
          }

          console.log(`[File Extraction] Successfully extracted ${extractedText.length} characters from ${slideCount} slides`);

          resolve({
            text: extractedText.trim(),
            slideCount,
            slideTitles: slideTitles.filter(Boolean),
            metadata: {
              title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
            }
          });
        }
      });
    });
    
  } catch (error: any) {
    console.error('[File Extraction] Error extracting text from PowerPoint:', error);
    throw new Error(`Failed to extract text from PowerPoint file: ${error.message}`);
  }
}

/**
 * Extract text from slide XML content
 */
function extractTextFromSlideXML(slideXML: any): { text: string; title?: string } {
  let text = '';
  let title = '';
  let isFirstText = true;

  function extractTextRecursive(obj: any) {
    if (typeof obj === 'string') {
      const cleanText = obj.trim();
      if (cleanText) {
        // If this is the first significant text, consider it as title
        if (isFirstText && cleanText.length < 100 && !cleanText.includes('\n')) {
          title = cleanText;
          isFirstText = false;
        }
        text += cleanText + ' ';
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(extractTextRecursive);
    } else if (typeof obj === 'object' && obj !== null) {
      // Look for text content in common PowerPoint XML elements
      if (obj['a:t']) {
        extractTextRecursive(obj['a:t']);
      } else if (obj.t) {
        extractTextRecursive(obj.t);
      } else {
        Object.values(obj).forEach(extractTextRecursive);
      }
    }
  }

  extractTextRecursive(slideXML);

  return {
    text: text.trim(),
    title: title || undefined
  };
}

/**
 * Extract text from plain text files
 */
export async function extractTextFromPlainText(fileBuffer: ArrayBuffer): Promise<ExtractedContent> {
  try {
    const text = new TextDecoder('utf-8').decode(fileBuffer);
    return {
      text: text.trim()
    };
  } catch (error: any) {
    throw new Error(`Failed to extract text from plain text file: ${error.message}`);
  }
}

/**
 * Main text extraction function that routes to appropriate parser based on file type
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer, 
  fileType: string, 
  fileName: string
): Promise<ExtractedContent> {
  
  console.log(`[File Extraction] Processing file: ${fileName} (${fileType})`);
  
  switch (fileType) {
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return await extractTextFromPowerPoint(fileBuffer, fileName);
    
    case 'application/vnd.ms-powerpoint':
      // For older .ppt files, we'll try the same parser (it might work for some)
      // In a production environment, you might want to use a different library
      try {
        return await extractTextFromPowerPoint(fileBuffer, fileName);
      } catch (error) {
        throw new Error('Legacy PowerPoint (.ppt) files are not fully supported. Please convert to .pptx format.');
      }
    
    case 'text/plain':
    case 'text/markdown':
    case 'text/csv':
      return await extractTextFromPlainText(fileBuffer);
    
    case 'application/pdf':
      // TODO: Implement PDF text extraction
      // For now, return a placeholder
      return {
        text: `PDF text extraction not yet implemented for ${fileName}. Please implement PDF parsing using a library like pdf-parse.`
      };
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      // TODO: Implement Word document text extraction
      // For now, return a placeholder
      return {
        text: `Word document text extraction not yet implemented for ${fileName}. Please implement DOCX parsing using a library like mammoth.`
      };
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Get file type icon for display purposes
 */
export function getFileTypeIcon(fileType: string): string {
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return '📊';
  }
  if (fileType.includes('pdf')) {
    return '📕';
  }
  if (fileType.includes('word') || fileType.includes('doc')) {
    return '📘';
  }
  if (fileType.includes('text') || fileType.includes('txt') || fileType.includes('markdown')) {
    return '📝';
  }
  return '📄';
} 