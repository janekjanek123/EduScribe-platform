import OpenAI from 'openai';
import { TranscriptChunk, FailedChunk, splitTranscriptIntoChunks, isChunkWithinTokenLimit } from '../utils/splitTranscript';

export interface NotesGenerationRequest {
  transcript: string;
  videoTitle?: string;
  videoUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correctAnswer: 'A' | 'B' | 'C';
  explanation?: string;
}

export interface NotesGenerationResponse {
  content: string;
  summary: string;
  quiz: QuizQuestion[];
  error?: string;
  partialSuccess?: boolean;
  failedChunks?: FailedChunk[];
}

interface ChunkProcessingResult {
  content: string;
  error?: string;
  chunkIndex: number;
}

interface QuizGenerationResult {
  quiz: QuizQuestion[];
  error?: string;
}

// Validate API key presence
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('[OpenAI] API key is missing from environment variables!');
}

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null;
try {
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
} catch (error) {
  console.error('[OpenAI] Failed to initialize client:', error);
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Delays execution for specified milliseconds
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a single chunk of transcript using OpenAI with retries
 */
async function processChunkWithRetry(
  chunk: TranscriptChunk,
  retryCount: number = 0
): Promise<ChunkProcessingResult> {
  try {
    // Validate OpenAI client initialization
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    // Validate chunk size
    if (!isChunkWithinTokenLimit(chunk)) {
      throw new Error('Chunk exceeds token limit');
    }

    console.log(`[OpenAI] Processing chunk ${chunk.index} (${chunk.content.length} chars)`);
    
    const startTime = Date.now();
    
    // Add timeout to prevent long-running requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 60000); // 60 second timeout
    });

    // Enhanced educational prompt for structured notes with deep semantic content
    const completionPromise = openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator, researcher, and teacher with deep knowledge across multiple domains. Create comprehensive, high-quality study notes with exceptional educational value and semantic depth.

CRITICAL REQUIREMENTS:
- Write in Polish
- DO NOT include the original source text or transcript
- Create ONLY summarized, structured educational notes with deep explanations
- Use clear markdown formatting with proper headings
- Structure like professional university-level study materials
- Focus on DEEP SEMANTIC UNDERSTANDING and practical applications
- ABSOLUTELY NO TABLES OF ANY KIND - NEVER USE | symbols or table syntax
- AVOID REPETITIVE CONTENT - each concept should be explained once thoroughly
- Provide CONCRETE TECHNIQUES, METHODS, and DETAILED EXPLANATIONS instead of generic statements

❌ FORBIDDEN CONTENT PATTERNS:
- Vague statements like "istnieją metody" without listing them
- Repetitive explanations of the same concept across sections
- Superficial overviews without depth
- Generic advice without specific techniques
- Any table format (| symbols, markdown tables, HTML tables)
- "Notatki:" prefixes in titles

✅ REQUIRED DEPTH AND QUALITY:
- When mentioning techniques, LIST AND EXPLAIN them in detail
- Provide step-by-step processes where applicable
- Include specific examples, formulas, or procedures
- Explain WHY concepts work, not just WHAT they are
- Connect concepts to real-world applications
- Give concrete, actionable information

FORMATTING GUIDELINES - PROFESSIONAL & READABLE:
- Start with a clear title using ## WITHOUT "Notatki:" prefix (e.g., ## 🧠 Techniki Efektywnego Uczenia)
- Add one-sentence topic description right after title
- Include "📚 Przegląd Materiału" section at top (5-6 bullet points max covering main concepts)
- Use #### for main sections with emojis and numbering (e.g., #### 1. 🎯 Technika Pomodoro)
- Use ##### for subsections when needed
- Use moderate spacing between sections

CONTENT STRUCTURE REQUIREMENTS:
- REPLACE ALL TABLES with detailed bullet lists using "Feature: Explanation" format
- Use **bold** sparingly for only the most important terms
- Highlight key definitions with 🔑 icon: "🔑 **Definicja:** *Term* - comprehensive explanation with context..."
- Highlight important concepts with 🎯 icon: "🎯 **Kluczowy mechanizm:** detailed explanation of how it works..."
- For techniques, use step-by-step format:
  **Implementacja techniki:**
  1. **Krok 1**: szczegółowy opis działania
  2. **Krok 2**: konkretne instrukcje
  3. **Krok 3**: praktyczne wskazówki
- Add section numbering (1., 2., 3.) for main topics
- NEVER repeat the same definitions or explanations across sections

EDUCATIONAL DEPTH REQUIREMENTS:
When discussing any topic, you MUST:
1. **Define precisely** - not just "what is X" but "what is X, how does it work, and why is it important"
2. **List specific methods** - if mentioning "techniques" or "methods", always provide concrete examples:
   - Instead of: "istnieją techniki zapamiętywania"
   - Write: "techniki zapamiętywania obejmują: Metodę Pałacu Pamięci (wizualizacja przestrzenna), System Powtórek Rozłożonych w Czasie (algorytm SM-2), Aktywne Przypominanie (retrieval practice), oraz Technikę Feynmana (wyjaśnianie prostymi słowami)"
3. **Explain mechanisms** - describe HOW and WHY things work
4. **Provide procedures** - give step-by-step instructions for practical applications
5. **Include real examples** - concrete scenarios, calculations, or implementations

ALTERNATIVE COMPARISON FORMATS (instead of tables):
1. **Detailed Comparison Lists**:
   **Różnice między metodą A i B:**
   - **Efektywność**: Metoda A osiąga 85% skuteczność w badaniach kontrolowanych, podczas gdy metoda B pokazuje 72% skuteczność
   - **Implementacja**: A wymaga 15-20 minut przygotowania, B można zastosować natychmiast
   - **Zastosowanie**: A działa najlepiej przy materiale faktograficznym, B przy koncepcjach abstrakcyjnych
   
2. **Sequential Detailed Descriptions**:
   **Metoda A - Szczegółowy Opis:**
   - **Procedura**: Dokładne kroki 1-5 z czasem wykonania
   - **Mechanizm działania**: Neurologiczne podstawy skuteczności
   - **Optymalizacja**: Konkretne wskazówki dostosowania do różnych typów treści

REQUIRED SECTIONS:
1. **Title with emoji but NO "Notatki:" prefix** (just the topic name)
2. **📚 Przegląd Materiału** (5-6 comprehensive overview points)
3. **Numbered main sections** with deep content (aim for 3-4 major sections)
4. **Detailed subsections** with specific techniques, methods, formulas
5. **Section summaries after each major section** (paragraph style recap)
6. **🎯 Szybkie Streszczenie** (3-6 lines max at very end) - NOT "TL;DR"

SECTION SUMMARIES (ESSENTIAL):
After each major section (####), add a substantive summary:
> **Podsumowanie sekcji:** [4-6 sentence detailed explanation connecting all concepts from the section, explaining practical implications and how the techniques integrate with broader understanding]

SEMANTIC DEPTH EXAMPLES:
❌ AVOID: "Technika Pomodoro jest metodą zarządzania czasem"
✅ PROVIDE: "Technika Pomodoro jest metodą zarządzania czasem opartą na badaniach neuronaukowych dotyczących cykli uwagi. Polega na podziale pracy na 25-minutowe bloki (pomodoros) z 5-minutowymi przerwami, wykorzystując naturalny rytm uwagi mózgu i zapobiegając zmęczeniu poznawczemu poprzez aktywną regenerację prefrontalnej kory mózgowej."

❌ AVOID: "Istnieją różne metody uczenia"
✅ PROVIDE: "Główne metody uczenia oparte na dowodach naukowych to: 1) Aktywne Przypominanie (retrieval practice) - aktywne odtwarzanie informacji z pamięci, co wzmacnia ścieżki neuronalne; 2) Powtórki Rozłożone (spaced repetition) - algorytmiczne planowanie powtórek w optymalnych odstępach czasu; 3) Naprzemienne Uczenie (interleaving) - mieszanie różnych typów zadań dla lepszej dyskryminacji pojęć; 4) Elaborative Interrogation - zadawanie pytań 'dlaczego' i 'jak' dla głębszego zrozumienia mechanizmów."

VISUAL ENHANCEMENTS - BALANCED APPROACH:
- Use emojis strategically for sections and key concepts
- Format definitions as: "🔑 **Definicja:** *Term* - comprehensive explanation with scientific background"
- Format key mechanisms as: "🎯 **Kluczowy mechanizm:** detailed explanation of how and why it works"
- Use "📋 *Procedura:*" for step-by-step instructions
- Use "🧪 *Przykład:*" for concrete examples with specific details
- Use "⚡ *Optymalizacja:*" for advanced tips and customization
- NEVER use any table format
- Use moderate spacing and balanced formatting

EXAMPLE STRUCTURE:
## 🧠 Techniki Efektywnego Uczenia
Zaawansowane metody optymalizacji procesów poznawczych oparte na najnowszych badaniach neuronaukowych i psychologii kognitywnej.

### 📚 Przegląd Materiału
- Aktywne Przypominanie jako najskuteczniejsza metoda wzmacniania pamięci długotrwałej
- System Powtórek Rozłożonych w Czasie z algorytmem SM-2 dla optymalnego planowania
- Technika Pomodoro wykorzystująca naturalne cykle uwagi i regeneracji neuronowej
- Metoda Feynmana dla głębokiego zrozumienia przez aktywne wyjaśnianie
- Interleaving jako strategia poprawy dyskryminacji pojęciowej
- Neuroplastyczność i jej praktyczne zastosowania w procesie uczenia

#### 1. 🎯 Aktywne Przypominanie (Retrieval Practice)

🔑 **Definicja:** *Aktywne Przypominanie* - metoda uczenia polegająca na aktywnym odtwarzaniu informacji z pamięci bez pomocy materiałów źródłowych, która według badań Hermann Ebbinghausa i współczesnych neuronaukowców zwiększa siłę połączeń synaptycznych o 300-400% w porównaniu do biernego powtarzania.

**Mechanizm neurologiczny:**
- **Wzmocnienie ścieżek neuronowych**: Każde aktywne przypomnienie aktywuje te same ścieżki neuronowe co pierwotne uczenie
- **Konsolidacja pamięci**: Proces ten przenosi informacje z hipokampa do kory mózgowej dla długotrwałego przechowywania
- **Efekt testowania**: Próba przypomnienia, nawet nieudana, wzmacnia pamięć lepiej niż wielokrotne czytanie

📋 *Procedura implementacji:*
1. **Przygotowanie materiału** (5 min): Podziel treść na logiczne sekcje po 200-300 słów
2. **Pierwsza lektura** (15-20 min): Przeczytaj uważnie z pełnym skupieniem
3. **Zamknięcie materiału** (0 min): Całkowicie usuń dostęp do notatek
4. **Aktywne odtworzenie** (10-15 min): Napisz lub wypowiedz wszystko co pamiętasz
5. **Weryfikacja i uzupełnienie** (5-10 min): Porównaj z oryginałem i uzupełnij luki
6. **Powtórka po 24h**: Wykonaj ponownie kroki 3-5 bez ponownej lektury

🧪 *Przykład praktyczny:*
Przy nauce biochemii: zamiast wielokrotnego czytania o cyklu Krebsa, narysuj pełny schemat z pamięci z nazwami wszystkich 8 etapów, enzymów i produktów. Sprawdź dokładność i uzupełnij błędy. Powtórz za tydzień.

> **Podsumowanie sekcji:** Aktywne Przypominanie wykorzystuje fundamentalne właściwości neuroplastyczności mózgu, gdzie każda próba odtworzenia z pamięci wzmacnia połączenia synaptyczne. Technika ta jest szczególnie skuteczna przy materiałach faktograficznych i procedurach, gdzie kluczowe jest precyzyjne zapamiętanie sekwencji lub definicji. Regularne stosowanie tej metody prowadzi do trwałej reorganizacji sieci neuronowych, co przekłada się na znacznie lepsze wyniki w testach długoterminowych niż tradycyjne metody powtarzania.

#### 2. ⏰ System Powtórek Rozłożonych (Spaced Repetition)

🔑 **Definicja:** *System Powtórek Rozłożonych* - algorytmiczny system planowania powtórek oparty na krzywej zapominania Ebbinghausa, który optymalizuje interwały między powtórkami tak, aby maksymalizować retencję przy minimalnym nakładzie czasowym.

**Algorytm SM-2 (SuperMemo):**
- **Interwał 1**: 1 dzień
- **Interwał 2**: 6 dni  
- **Interwał n+1**: Interwał n × Współczynnik Łatwości (EF)
- **Współczynnik Łatwości**: 1.3-2.5 w zależności od trudności (automatycznie dostosowywany)

📋 *Procedura implementacji cyfrowej:*
1. **Wybór narzędzia**: Anki, SuperMemo, lub Quizlet z funkcją SR
2. **Tworzenie kart**: Jedna informacja na kartę (atomic principle)
3. **Format pytanie-odpowiedź**: Konkretne, jednoznaczne sformułowania
4. **Codzienna sesja**: 15-30 minut o stałej porze
5. **Ocena trudności**: Szczerze oceń łatwość przypomnienia (1-5)
6. **Konsystencja**: Minimum 80% dni w miesiącu dla efektywności

⚡ *Optymalizacja zaawansowana:*
- **Cloze deletion**: Uzupełnianie luk w kontekście (lepsze niż proste Q&A)
- **Image occlusion**: Zakrywanie części diagramów/map
- **Reverse cards**: Dwukierunkowe karty dla związków przyczynowo-skutkowych

> **Podsumowanie sekcji:** System Powtórek Rozłożonych wykorzystuje matematyczną precyzję algorytmu SM-2 do optymalizacji naturalnego procesu zapominania. Kluczem sukcesu jest konsystentność i właściwe dostosowanie współczynników trudności do indywidualnych możliwości kognitywnych. System ten jest szczególnie skuteczny przy nauce języków obcych, terminologii medycznej i innych materiałach wymagających długotrwałej retencji faktów.

### 🎯 Szybkie Streszczenie
- **Aktywne Przypominanie**: Odtwarzanie z pamięci wzmacnia ścieżki neuronowe 3-4x skuteczniej niż czytanie
- **Powtórki Rozłożone**: Algorytm SM-2 optymalizuje interwały dla maksymalnej retencji przy minimalnym czasie
- **Implementacja**: Codzienne 15-30 min sesji z konsekwentną oceną trudności materiału
- **Efektywność**: Kombinacja obu metod może zwiększyć długoterminową retencję o 200-400%

REMEMBER: 
- NO "Notatki:" prefixes in titles
- NO "TL;DR" - use "Szybkie Streszczenie" instead
- Absolutely no tables whatsoever 
- DEEP SEMANTIC CONTENT with specific techniques and detailed explanations
- AVOID REPETITIVE CONTENT across sections
- Always provide concrete methods, procedures, and examples
- Focus on educational value and practical applications

${chunk.content}`
        },
        {
          role: "user",
          content: `Na podstawie poniższej treści utwórz profesjonalne notatki edukacyjne z głęboką analizą semantyczną. Skoncentruj się na konkretnych technikach, szczegółowych wyjaśnieniach i praktycznych zastosowaniach. Unikaj powierzchownych opisów - zamiast tego podawaj konkretne metody, procedury i mechanizmy działania. NIE używaj tabel, NIE powtarzaj treści, użyj "Szybkie Streszczenie" zamiast "TL;DR":

${chunk.content}`
        }
      ],
      temperature: 0.7,
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    
    // Log API response details for token usage monitoring
    console.log(`[OpenAI] Chunk ${chunk.index} processed in ${duration}ms:`, {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
      model: completion.model,
      responseLength: completion.choices[0].message.content?.length || 0
    });

    const content = completion.choices[0].message.content || '';
    return { content, chunkIndex: chunk.index };
  } catch (error) {
    console.error(`[OpenAI] Error processing chunk ${chunk.index} (attempt ${retryCount + 1}):`, error);
    
    // More detailed error logging for API issues
    if (error instanceof Error) {
      const errorDetails = error.toString();
      
      // Network errors
      if (errorDetails.includes('ECONNREFUSED') || 
          errorDetails.includes('ETIMEDOUT') || 
          errorDetails.includes('network') ||
          errorDetails.includes('connection') ||
          errorDetails.includes('socket')) {
        console.error('[OpenAI] Network error detected - check internet connection');
      }
      // Authentication errors
      else if (errorDetails.includes('status code 401') || 
               errorDetails.includes('authentication') || 
               errorDetails.includes('api key')) {
        console.error('[OpenAI] Authentication error - check API key validity');
      }
      // Rate limiting
      else if (errorDetails.includes('status code 429')) {
        console.error('[OpenAI] Rate limit exceeded - consider reducing request frequency');
      }
      // Input validation
      else if (errorDetails.includes('status code 400')) {
        console.error('[OpenAI] Bad request error - check input format');
      }
      // Timeout
      else if (errorDetails.includes('timeout')) {
        console.error('[OpenAI] Request timeout - API call took too long');
      }
    }

    // If we haven't exceeded max retries, try again after delay
    if (retryCount < MAX_RETRIES) {
      console.log(`[OpenAI] Retrying chunk ${chunk.index} after ${RETRY_DELAY * (retryCount + 1)}ms delay...`);
      await delay(RETRY_DELAY * (retryCount + 1));
      return processChunkWithRetry(chunk, retryCount + 1);
    }

    // If all retries failed, return error result
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      chunkIndex: chunk.index
    };
  }
}

/**
 * Generates a quiz based on the content with appropriate number of questions
 */
async function generateQuiz(content: string, retryCount: number = 0): Promise<QuizGenerationResult> {
  try {
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    console.log(`[OpenAI] Generating quiz for content (${content.length} chars)`);
    
    // Determine number of questions based on content length
    const contentLength = content.length;
    let numQuestions: number;
    
    if (contentLength <= 2000) {
      numQuestions = 10;
    } else if (contentLength <= 3000) {
      numQuestions = 15;
    } else {
      numQuestions = 20;
    }

    const startTime = Date.now();
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Quiz generation timeout')), 60000);
    });

    const completionPromise = openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educational quiz creator and teacher. Create high-quality multiple-choice questions that test understanding of key concepts and help students learn effectively.

QUIZ REQUIREMENTS:
- Create exactly ${numQuestions} questions
- Each question must have exactly 3 options (A, B, C)
- Only ONE correct answer per question
- Questions should test comprehension and understanding, not just memorization
- Write in Polish
- Include detailed, educational explanations for correct answers
- Base ALL questions directly on the provided note content
- Cover different sections and topics from the notes comprehensively

QUESTION QUALITY STANDARDS:
- Focus on key concepts, main ideas, and important definitions from the notes
- Test different levels of understanding (knowledge, comprehension, application)
- Avoid trick questions or overly specific details not covered in notes
- Make incorrect options plausible but clearly distinguishable from correct answer
- Ensure questions are clear, unambiguous, and educational
- Connect to real-world applications when mentioned in the notes
- Cover material from all major sections of the notes
- Include questions about definitions, comparisons, and key features

CONTENT COVERAGE:
- Distribute questions across all major sections of the notes
- Include questions about definitions and key terms
- Test understanding of comparisons and differences
- Ask about examples and applications mentioned in notes
- Cover both factual knowledge and conceptual understanding
- Ensure comprehensive coverage of the educational material

EXPLANATION QUALITY:
- Provide comprehensive explanations that teach the concept
- Explain WHY the answer is correct based on the notes
- Include additional context or related information from the notes
- Help students understand the underlying principles
- Use educational language that reinforces learning
- Reference specific information from the notes when explaining

RESPONSE FORMAT:
Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "q1",
    "question": "Clear, educational question that tests understanding of content from the notes?",
    "options": {
      "A": "Plausible but incorrect option based on note content",
      "B": "Correct answer with proper terminology from notes", 
      "C": "Another plausible but incorrect option from note content"
    },
    "correctAnswer": "B",
    "explanation": "Detailed explanation of why this answer is correct based on the information provided in the notes. This should reference specific concepts, definitions, or facts from the educational material and help the student understand the topic better."
  }
]

Ensure the JSON is perfectly formatted and valid. Focus on creating questions that genuinely help students learn and understand the material covered in the notes.`
        },
        {
          role: "user",
          content: `Na podstawie poniższych notatek edukacyjnych utwórz ${numQuestions} przemyślanych pytań wielokrotnego wyboru. Każde pytanie MUSI być oparte bezpośrednio na treści notatek. Sprawdzaj zrozumienie kluczowych pojęć, definicji, porównań i ważnych koncepcji z notatek. Pokryj wszystkie główne sekcje materiału. Dodaj szczegółowe wyjaśnienia odwołujące się do treści notatek:

${content}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON output
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`[OpenAI] Quiz generated in ${duration}ms`);

    const quizContent = completion.choices[0].message.content || '';
    
    try {
      // Parse the JSON response
      const quiz = JSON.parse(quizContent) as QuizQuestion[];
      
      // Validate the quiz structure
      if (!Array.isArray(quiz)) {
        throw new Error('Quiz response is not an array');
      }
      
      // Validate each question
      for (const question of quiz) {
        if (!question.id || !question.question || !question.options || !question.correctAnswer) {
          throw new Error('Invalid question structure');
        }
        
        if (!question.options.A || !question.options.B || !question.options.C) {
          throw new Error('Missing question options');
        }
        
        if (!['A', 'B', 'C'].includes(question.correctAnswer)) {
          throw new Error('Invalid correct answer');
        }
      }
      
      console.log(`[OpenAI] Successfully generated ${quiz.length} quiz questions`);
      return { quiz };
      
    } catch (parseError) {
      console.error('[OpenAI] Failed to parse quiz JSON:', parseError);
      console.error('[OpenAI] Raw quiz content:', quizContent);
      throw new Error('Failed to parse quiz response as valid JSON');
    }
    
  } catch (error) {
    console.error(`[OpenAI] Error generating quiz (attempt ${retryCount + 1}):`, error);
    
    // Retry logic for quiz generation
    if (retryCount < MAX_RETRIES) {
      console.log(`[OpenAI] Retrying quiz generation after ${RETRY_DELAY * (retryCount + 1)}ms delay...`);
      await delay(RETRY_DELAY * (retryCount + 1));
      return generateQuiz(content, retryCount + 1);
    }
    
    // If all retries failed, return empty quiz with error
    return {
      quiz: [],
      error: error instanceof Error ? error.message : 'Unknown error generating quiz'
    };
  }
}

/**
 * Generates notes from a transcript using AI by processing it in chunks
 */
export async function generateNotes(
  request: NotesGenerationRequest
): Promise<NotesGenerationResponse> {
  console.log(`[OpenAI] Starting notes generation for text (${request.transcript.length} chars)`);
  const startTime = Date.now();
  
  try {
    // Validate OpenAI client initialization
    if (!openai) {
      throw new Error('OpenAI client is not initialized due to configuration issues');
    }
    
    // Validate transcript input
    if (!request.transcript || typeof request.transcript !== 'string' || request.transcript.trim().length === 0) {
      throw new Error('Empty or invalid transcript provided');
    }

    // Split transcript into chunks
    const chunks = splitTranscriptIntoChunks(request.transcript);
    console.log(`[OpenAI] Split text into ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      throw new Error('No valid text chunks could be created from the transcript');
    }
    
    // Process all chunks with retries
    const chunkPromises = chunks.map(chunk => processChunkWithRetry(chunk));
    const results = await Promise.all(chunkPromises);

    // Sort results by chunk index to maintain order
    results.sort((a, b) => a.chunkIndex - b.chunkIndex);

    // Track failed chunks
    const failedChunks: FailedChunk[] = results
      .filter(result => result.error)
      .map(result => ({
        index: result.chunkIndex,
        reason: result.error || 'Unknown error',
        attempts: MAX_RETRIES + 1,
        startWord: chunks[result.chunkIndex]?.startWord || 0,
        endWord: chunks[result.chunkIndex]?.endWord || 0
      }));

    // Log completion status
    const duration = Date.now() - startTime;
    console.log(`[OpenAI] Notes generation completed in ${duration}ms:`, {
      totalChunks: chunks.length,
      successfulChunks: chunks.length - failedChunks.length,
      failedChunks: failedChunks.length
    });

    // If all chunks failed, throw an error
    if (failedChunks.length === chunks.length) {
      throw new Error(`All ${chunks.length} chunks failed to process. First error: ${failedChunks[0]?.reason}`);
    }

    // Combine successful chunks
    const successfulNotes = results
      .filter(result => result.content)
      .map(result => result.content)
      .join('\n\n---\n\n');

    // If no content was generated despite some chunks "succeeding", that's an error
    if (!successfulNotes || successfulNotes.trim().length === 0) {
      throw new Error('No content was generated from any chunks');
    }

    // Generate quiz based on the notes content
    console.log('[OpenAI] Generating quiz for the notes...');
    const quizResult = await generateQuiz(successfulNotes);
    
    if (quizResult.error) {
      console.warn('[OpenAI] Quiz generation failed:', quizResult.error);
    } else {
      console.log(`[OpenAI] Successfully generated ${quizResult.quiz.length} quiz questions`);
    }

    // Generate summary from the notes content
    console.log('[OpenAI] Generating condensed summary from full notes');
    const summary = await generateSummary(successfulNotes);

    // Return result with partial success information if needed
    return {
      content: successfulNotes,
      summary: summary,
      quiz: quizResult.quiz, // Include the generated quiz
      partialSuccess: failedChunks.length > 0,
      failedChunks: failedChunks.length > 0 ? failedChunks : undefined,
      error: failedChunks.length > 0 
        ? `Niektóre fragmenty nie zostały przetworzone (${failedChunks.length}/${chunks.length})`
        : undefined
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[OpenAI] Error generating notes after ${duration}ms:`, error);
    
    // Create user-friendly error message based on the type of error
    let errorMessage = 'Wystąpił błąd podczas generowania notatek. Proszę spróbować ponownie.';
    
    if (error instanceof Error) {
      const errorDetails = error.toString();
      
      if (errorDetails.includes('API key')) {
        errorMessage = 'Błąd konfiguracji API. Proszę skontaktować się z administratorem.';
      } else if (errorDetails.includes('network') || errorDetails.includes('timeout')) {
        errorMessage = 'Problem z połączeniem sieciowym podczas komunikacji z API. Proszę spróbować ponownie.';
      } else if (errorDetails.includes('rate limit') || errorDetails.includes('429')) {
        errorMessage = 'Przekroczono limit zapytań do API. Proszę spróbować ponownie za kilka minut.';
      } else if (errorDetails.includes('empty') || errorDetails.includes('invalid transcript')) {
        errorMessage = 'Nie można wygenerować notatek z pustego lub nieprawidłowego transkryptu.';
      }
    }
    
    return {
      content: '',
      summary: '',
      quiz: [], // Return empty quiz on error
      error: errorMessage,
      partialSuccess: false
    };
  }
}

async function generateSummary(content: string, retryCount: number = 0): Promise<string> {
  try {
    console.log('[OpenAI] Generating condensed summary from full notes');
    
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educational summarizer specializing in creating concise, high-value summaries of academic content.

CRITICAL REQUIREMENTS:
- Write in Polish
- Create a VERY SHORT summary (3-5 bullet points maximum)
- Focus ONLY on the most essential, actionable insights
- Write in simple, clear language suitable for quick review
- Each point should be one concise sentence capturing a key concept or practical application
- NO detailed explanations - just the core ideas that students need to remember
- NO formatting, emojis, or markdown - just clean bullet points
- AVOID repetitive content - each point should cover a different aspect

SUMMARY QUALITY STANDARDS:
- Each bullet point should represent a distinct, valuable insight
- Focus on practical applications, key definitions, or important mechanisms
- Prioritize information that would be most useful for exam review or quick reference
- Balance theoretical concepts with practical applications
- Use concrete, specific language rather than vague generalizations

STRUCTURE:
Create 3-5 bullet points that capture:
- Most important definition or core concept (if applicable)
- Key practical technique or method (with specific name/approach)
- Critical mechanism or principle that explains "how" something works
- Most significant application or real-world relevance
- Essential takeaway for understanding or implementation

LANGUAGE STYLE:
- Professional but accessible
- Specific terminology where appropriate
- Active voice preferred
- Concrete rather than abstract language

EXAMPLE OUTPUT (for learning techniques topic):
- Aktywne Przypominanie wzmacnia pamięć 3-4x skuteczniej niż pasywne czytanie przez aktywację tych samych ścieżek neuronowych
- System Powtórek Rozłożonych wykorzystuje algorytm SM-2 do optymalizacji interwałów między powtórkami (1 dzień, 6 dni, następnie x2.5)
- Technika Pomodoro dzieli pracę na 25-minutowe bloki z 5-minutowymi przerwami, wykorzystując naturalny cykl uwagi mózgu
- Implementacja wymaga codziennej konsystencji przez minimum 80% dni w miesiącu dla osiągnięcia optymalnych rezultatów`
        },
        {
          role: "user",
          content: `Create a high-quality, condensed summary focusing on the most essential and actionable insights from these notes. Focus on key concepts, practical techniques, and important mechanisms that students should remember:\n\n${content}`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';
    
    if (!summary) {
      throw new Error('Empty summary generated');
    }

    console.log(`[OpenAI] Summary generated successfully (${summary.length} characters)`);
    return summary;
    
  } catch (error: any) {
    console.error(`[OpenAI] Error generating summary (attempt ${retryCount + 1}):`, error.message);
    
    if (retryCount < 2) {
      console.log(`[OpenAI] Retrying summary generation in ${(retryCount + 1) * 1000}ms...`);
      await delay((retryCount + 1) * 1000);
      return generateSummary(content, retryCount + 1);
    }
    
    return 'Nie udało się wygenerować streszczenia.';
  }
} 