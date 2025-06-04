"use strict";exports.id=1215,exports.ids=[1215],exports.modules={51215:(e,n,t)=>{t.d(n,{L:()=>l});var o=t(75605);let i=process.env.OPENAI_API_KEY;i||console.error("[OpenAI] API key is missing from environment variables!");let a=null;try{a=new o.ZP({apiKey:i})}catch(e){console.error("[OpenAI] Failed to initialize client:",e)}let r=e=>new Promise(n=>setTimeout(n,e));async function s(e,n=0){try{if(!a)throw Error("OpenAI client is not initialized");if(!function(e,n=3e3){return Math.ceil(e.content.length/4)<=n}(e))throw Error("Chunk exceeds token limit");console.log(`[OpenAI] Processing chunk ${e.index} (${e.content.length} chars)`);let n=Date.now(),t=new Promise((e,n)=>{setTimeout(()=>n(Error("Request timeout")),6e4)}),o=a.chat.completions.create({model:"gpt-3.5-turbo",messages:[{role:"system",content:`You are an expert educational content creator, researcher, and teacher with deep knowledge across multiple domains. Create comprehensive, high-quality study notes with exceptional educational value and semantic depth.

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
  1. **Krok 1**: szczeg\xf3łowy opis działania
  2. **Krok 2**: konkretne instrukcje
  3. **Krok 3**: praktyczne wskaz\xf3wki
- Add section numbering (1., 2., 3.) for main topics
- NEVER repeat the same definitions or explanations across sections

EDUCATIONAL DEPTH REQUIREMENTS:
When discussing any topic, you MUST:
1. **Define precisely** - not just "what is X" but "what is X, how does it work, and why is it important"
2. **List specific methods** - if mentioning "techniques" or "methods", always provide concrete examples:
   - Instead of: "istnieją techniki zapamiętywania"
   - Write: "techniki zapamiętywania obejmują: Metodę Pałacu Pamięci (wizualizacja przestrzenna), System Powt\xf3rek Rozłożonych w Czasie (algorytm SM-2), Aktywne Przypominanie (retrieval practice), oraz Technikę Feynmana (wyjaśnianie prostymi słowami)"
3. **Explain mechanisms** - describe HOW and WHY things work
4. **Provide procedures** - give step-by-step instructions for practical applications
5. **Include real examples** - concrete scenarios, calculations, or implementations

ALTERNATIVE COMPARISON FORMATS (instead of tables):
1. **Detailed Comparison Lists**:
   **R\xf3żnice między metodą A i B:**
   - **Efektywność**: Metoda A osiąga 85% skuteczność w badaniach kontrolowanych, podczas gdy metoda B pokazuje 72% skuteczność
   - **Implementacja**: A wymaga 15-20 minut przygotowania, B można zastosować natychmiast
   - **Zastosowanie**: A działa najlepiej przy materiale faktograficznym, B przy koncepcjach abstrakcyjnych
   
2. **Sequential Detailed Descriptions**:
   **Metoda A - Szczeg\xf3łowy Opis:**
   - **Procedura**: Dokładne kroki 1-5 z czasem wykonania
   - **Mechanizm działania**: Neurologiczne podstawy skuteczności
   - **Optymalizacja**: Konkretne wskaz\xf3wki dostosowania do r\xf3żnych typ\xf3w treści

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
✅ PROVIDE: "Technika Pomodoro jest metodą zarządzania czasem opartą na badaniach neuronaukowych dotyczących cykli uwagi. Polega na podziale pracy na 25-minutowe bloki (pomodoros) z 5-minutowymi przerwami, wykorzystując naturalny rytm uwagi m\xf3zgu i zapobiegając zmęczeniu poznawczemu poprzez aktywną regenerację prefrontalnej kory m\xf3zgowej."

❌ AVOID: "Istnieją r\xf3żne metody uczenia"
✅ PROVIDE: "Gł\xf3wne metody uczenia oparte na dowodach naukowych to: 1) Aktywne Przypominanie (retrieval practice) - aktywne odtwarzanie informacji z pamięci, co wzmacnia ścieżki neuronalne; 2) Powt\xf3rki Rozłożone (spaced repetition) - algorytmiczne planowanie powt\xf3rek w optymalnych odstępach czasu; 3) Naprzemienne Uczenie (interleaving) - mieszanie r\xf3żnych typ\xf3w zadań dla lepszej dyskryminacji pojęć; 4) Elaborative Interrogation - zadawanie pytań 'dlaczego' i 'jak' dla głębszego zrozumienia mechanizm\xf3w."

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
Zaawansowane metody optymalizacji proces\xf3w poznawczych oparte na najnowszych badaniach neuronaukowych i psychologii kognitywnej.

### 📚 Przegląd Materiału
- Aktywne Przypominanie jako najskuteczniejsza metoda wzmacniania pamięci długotrwałej
- System Powt\xf3rek Rozłożonych w Czasie z algorytmem SM-2 dla optymalnego planowania
- Technika Pomodoro wykorzystująca naturalne cykle uwagi i regeneracji neuronowej
- Metoda Feynmana dla głębokiego zrozumienia przez aktywne wyjaśnianie
- Interleaving jako strategia poprawy dyskryminacji pojęciowej
- Neuroplastyczność i jej praktyczne zastosowania w procesie uczenia

#### 1. 🎯 Aktywne Przypominanie (Retrieval Practice)

🔑 **Definicja:** *Aktywne Przypominanie* - metoda uczenia polegająca na aktywnym odtwarzaniu informacji z pamięci bez pomocy materiał\xf3w źr\xf3dłowych, kt\xf3ra według badań Hermann Ebbinghausa i wsp\xf3łczesnych neuronaukowc\xf3w zwiększa siłę połączeń synaptycznych o 300-400% w por\xf3wnaniu do biernego powtarzania.

**Mechanizm neurologiczny:**
- **Wzmocnienie ścieżek neuronowych**: Każde aktywne przypomnienie aktywuje te same ścieżki neuronowe co pierwotne uczenie
- **Konsolidacja pamięci**: Proces ten przenosi informacje z hipokampa do kory m\xf3zgowej dla długotrwałego przechowywania
- **Efekt testowania**: Pr\xf3ba przypomnienia, nawet nieudana, wzmacnia pamięć lepiej niż wielokrotne czytanie

📋 *Procedura implementacji:*
1. **Przygotowanie materiału** (5 min): Podziel treść na logiczne sekcje po 200-300 sł\xf3w
2. **Pierwsza lektura** (15-20 min): Przeczytaj uważnie z pełnym skupieniem
3. **Zamknięcie materiału** (0 min): Całkowicie usuń dostęp do notatek
4. **Aktywne odtworzenie** (10-15 min): Napisz lub wypowiedz wszystko co pamiętasz
5. **Weryfikacja i uzupełnienie** (5-10 min): Por\xf3wnaj z oryginałem i uzupełnij luki
6. **Powt\xf3rka po 24h**: Wykonaj ponownie kroki 3-5 bez ponownej lektury

🧪 *Przykład praktyczny:*
Przy nauce biochemii: zamiast wielokrotnego czytania o cyklu Krebsa, narysuj pełny schemat z pamięci z nazwami wszystkich 8 etap\xf3w, enzym\xf3w i produkt\xf3w. Sprawdź dokładność i uzupełnij błędy. Powt\xf3rz za tydzień.

> **Podsumowanie sekcji:** Aktywne Przypominanie wykorzystuje fundamentalne właściwości neuroplastyczności m\xf3zgu, gdzie każda pr\xf3ba odtworzenia z pamięci wzmacnia połączenia synaptyczne. Technika ta jest szczeg\xf3lnie skuteczna przy materiałach faktograficznych i procedurach, gdzie kluczowe jest precyzyjne zapamiętanie sekwencji lub definicji. Regularne stosowanie tej metody prowadzi do trwałej reorganizacji sieci neuronowych, co przekłada się na znacznie lepsze wyniki w testach długoterminowych niż tradycyjne metody powtarzania.

#### 2. ⏰ System Powt\xf3rek Rozłożonych (Spaced Repetition)

🔑 **Definicja:** *System Powt\xf3rek Rozłożonych* - algorytmiczny system planowania powt\xf3rek oparty na krzywej zapominania Ebbinghausa, kt\xf3ry optymalizuje interwały między powt\xf3rkami tak, aby maksymalizować retencję przy minimalnym nakładzie czasowym.

**Algorytm SM-2 (SuperMemo):**
- **Interwał 1**: 1 dzień
- **Interwał 2**: 6 dni  
- **Interwał n+1**: Interwał n \xd7 Wsp\xf3łczynnik Łatwości (EF)
- **Wsp\xf3łczynnik Łatwości**: 1.3-2.5 w zależności od trudności (automatycznie dostosowywany)

📋 *Procedura implementacji cyfrowej:*
1. **Wyb\xf3r narzędzia**: Anki, SuperMemo, lub Quizlet z funkcją SR
2. **Tworzenie kart**: Jedna informacja na kartę (atomic principle)
3. **Format pytanie-odpowiedź**: Konkretne, jednoznaczne sformułowania
4. **Codzienna sesja**: 15-30 minut o stałej porze
5. **Ocena trudności**: Szczerze oceń łatwość przypomnienia (1-5)
6. **Konsystencja**: Minimum 80% dni w miesiącu dla efektywności

⚡ *Optymalizacja zaawansowana:*
- **Cloze deletion**: Uzupełnianie luk w kontekście (lepsze niż proste Q&A)
- **Image occlusion**: Zakrywanie części diagram\xf3w/map
- **Reverse cards**: Dwukierunkowe karty dla związk\xf3w przyczynowo-skutkowych

> **Podsumowanie sekcji:** System Powt\xf3rek Rozłożonych wykorzystuje matematyczną precyzję algorytmu SM-2 do optymalizacji naturalnego procesu zapominania. Kluczem sukcesu jest konsystentność i właściwe dostosowanie wsp\xf3łczynnik\xf3w trudności do indywidualnych możliwości kognitywnych. System ten jest szczeg\xf3lnie skuteczny przy nauce język\xf3w obcych, terminologii medycznej i innych materiałach wymagających długotrwałej retencji fakt\xf3w.

### 🎯 Szybkie Streszczenie
- **Aktywne Przypominanie**: Odtwarzanie z pamięci wzmacnia ścieżki neuronowe 3-4x skuteczniej niż czytanie
- **Powt\xf3rki Rozłożone**: Algorytm SM-2 optymalizuje interwały dla maksymalnej retencji przy minimalnym czasie
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

${e.content}`},{role:"user",content:`Na podstawie poniższej treści utw\xf3rz profesjonalne notatki edukacyjne z głęboką analizą semantyczną. Skoncentruj się na konkretnych technikach, szczeg\xf3łowych wyjaśnieniach i praktycznych zastosowaniach. Unikaj powierzchownych opis\xf3w - zamiast tego podawaj konkretne metody, procedury i mechanizmy działania. NIE używaj tabel, NIE powtarzaj treści, użyj "Szybkie Streszczenie" zamiast "TL;DR":

${e.content}`}],temperature:.7}),i=await Promise.race([o,t]),r=Date.now()-n;return console.log(`[OpenAI] Chunk ${e.index} processed in ${r}ms:`,{promptTokens:i.usage?.prompt_tokens,completionTokens:i.usage?.completion_tokens,totalTokens:i.usage?.total_tokens,model:i.model,responseLength:i.choices[0].message.content?.length||0}),{content:i.choices[0].message.content||"",chunkIndex:e.index}}catch(t){if(console.error(`[OpenAI] Error processing chunk ${e.index} (attempt ${n+1}):`,t),t instanceof Error){let e=t.toString();e.includes("ECONNREFUSED")||e.includes("ETIMEDOUT")||e.includes("network")||e.includes("connection")||e.includes("socket")?console.error("[OpenAI] Network error detected - check internet connection"):e.includes("status code 401")||e.includes("authentication")||e.includes("api key")?console.error("[OpenAI] Authentication error - check API key validity"):e.includes("status code 429")?console.error("[OpenAI] Rate limit exceeded - consider reducing request frequency"):e.includes("status code 400")?console.error("[OpenAI] Bad request error - check input format"):e.includes("timeout")&&console.error("[OpenAI] Request timeout - API call took too long")}if(n<2)return console.log(`[OpenAI] Retrying chunk ${e.index} after ${1e3*(n+1)}ms delay...`),await r(1e3*(n+1)),s(e,n+1);return{content:"",error:t instanceof Error?t.message:"Unknown error",chunkIndex:e.index}}}async function c(e,n=0){try{let n;if(!a)throw Error("OpenAI client is not initialized");console.log(`[OpenAI] Generating quiz for content (${e.length} chars)`);let t=e.length;n=t<=2e3?10:t<=3e3?15:20;let o=Date.now(),i=new Promise((e,n)=>{setTimeout(()=>n(Error("Quiz generation timeout")),6e4)}),r=a.chat.completions.create({model:"gpt-3.5-turbo",messages:[{role:"system",content:`You are an expert educational quiz creator and teacher. Create high-quality multiple-choice questions that test understanding of key concepts and help students learn effectively.

QUIZ REQUIREMENTS:
- Create exactly ${n} questions
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

Ensure the JSON is perfectly formatted and valid. Focus on creating questions that genuinely help students learn and understand the material covered in the notes.`},{role:"user",content:`Na podstawie poniższych notatek edukacyjnych utw\xf3rz ${n} przemyślanych pytań wielokrotnego wyboru. Każde pytanie MUSI być oparte bezpośrednio na treści notatek. Sprawdzaj zrozumienie kluczowych pojęć, definicji, por\xf3wnań i ważnych koncepcji z notatek. Pokryj wszystkie gł\xf3wne sekcje materiału. Dodaj szczeg\xf3łowe wyjaśnienia odwołujące się do treści notatek:

${e}`}],temperature:.3}),s=await Promise.race([r,i]),c=Date.now()-o;console.log(`[OpenAI] Quiz generated in ${c}ms`);let l=s.choices[0].message.content||"";try{let e=JSON.parse(l);if(!Array.isArray(e))throw Error("Quiz response is not an array");for(let n of e){if(!n.id||!n.question||!n.options||!n.correctAnswer)throw Error("Invalid question structure");if(!n.options.A||!n.options.B||!n.options.C)throw Error("Missing question options");if(!["A","B","C"].includes(n.correctAnswer))throw Error("Invalid correct answer")}return console.log(`[OpenAI] Successfully generated ${e.length} quiz questions`),{quiz:e}}catch(e){throw console.error("[OpenAI] Failed to parse quiz JSON:",e),console.error("[OpenAI] Raw quiz content:",l),Error("Failed to parse quiz response as valid JSON")}}catch(t){if(console.error(`[OpenAI] Error generating quiz (attempt ${n+1}):`,t),n<2)return console.log(`[OpenAI] Retrying quiz generation after ${1e3*(n+1)}ms delay...`),await r(1e3*(n+1)),c(e,n+1);return{quiz:[],error:t instanceof Error?t.message:"Unknown error generating quiz"}}}async function l(e){console.log(`[OpenAI] Starting notes generation for text (${e.transcript.length} chars)`);let n=Date.now();try{if(!a)throw Error("OpenAI client is not initialized due to configuration issues");if(!e.transcript||"string"!=typeof e.transcript||0===e.transcript.trim().length)throw Error("Empty or invalid transcript provided");let t=function(e,n=800){let t=e.split(/\s+/).filter(e=>e.length>0),o=[];for(let e=0;e<t.length;e+=n){let i=e,a=Math.min(e+n,t.length),r=t.slice(i,a);o.push({content:r.join(" "),index:o.length,wordCount:r.length,startWord:i,endWord:a})}return o}(e.transcript);if(console.log(`[OpenAI] Split text into ${t.length} chunks`),0===t.length)throw Error("No valid text chunks could be created from the transcript");let o=t.map(e=>s(e)),i=await Promise.all(o);i.sort((e,n)=>e.chunkIndex-n.chunkIndex);let r=i.filter(e=>e.error).map(e=>({index:e.chunkIndex,reason:e.error||"Unknown error",attempts:3,startWord:t[e.chunkIndex]?.startWord||0,endWord:t[e.chunkIndex]?.endWord||0})),l=Date.now()-n;if(console.log(`[OpenAI] Notes generation completed in ${l}ms:`,{totalChunks:t.length,successfulChunks:t.length-r.length,failedChunks:r.length}),r.length===t.length)throw Error(`All ${t.length} chunks failed to process. First error: ${r[0]?.reason}`);let u=i.filter(e=>e.content).map(e=>e.content).join("\n\n---\n\n");if(!u||0===u.trim().length)throw Error("No content was generated from any chunks");console.log("[OpenAI] Generating quiz for the notes...");let m=await c(u);m.error?console.warn("[OpenAI] Quiz generation failed:",m.error):console.log(`[OpenAI] Successfully generated ${m.quiz.length} quiz questions`),console.log("[OpenAI] Generating condensed summary from full notes");let d=await p(u);return{content:u,summary:d,quiz:m.quiz,partialSuccess:r.length>0,failedChunks:r.length>0?r:void 0,error:r.length>0?`Niekt\xf3re fragmenty nie zostały przetworzone (${r.length}/${t.length})`:void 0}}catch(o){let e=Date.now()-n;console.error(`[OpenAI] Error generating notes after ${e}ms:`,o);let t="Wystąpił błąd podczas generowania notatek. Proszę spr\xf3bować ponownie.";if(o instanceof Error){let e=o.toString();e.includes("API key")?t="Błąd konfiguracji API. Proszę skontaktować się z administratorem.":e.includes("network")||e.includes("timeout")?t="Problem z połączeniem sieciowym podczas komunikacji z API. Proszę spr\xf3bować ponownie.":e.includes("rate limit")||e.includes("429")?t="Przekroczono limit zapytań do API. Proszę spr\xf3bować ponownie za kilka minut.":(e.includes("empty")||e.includes("invalid transcript"))&&(t="Nie można wygenerować notatek z pustego lub nieprawidłowego transkryptu.")}return{content:"",summary:"",quiz:[],error:t,partialSuccess:!1}}}async function p(e,n=0){try{if(console.log("[OpenAI] Generating condensed summary from full notes"),!a)throw Error("OpenAI client is not initialized");let n=await a.chat.completions.create({model:"gpt-3.5-turbo",messages:[{role:"system",content:`You are an expert educational summarizer specializing in creating concise, high-value summaries of academic content.

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
- System Powt\xf3rek Rozłożonych wykorzystuje algorytm SM-2 do optymalizacji interwał\xf3w między powt\xf3rkami (1 dzień, 6 dni, następnie x2.5)
- Technika Pomodoro dzieli pracę na 25-minutowe bloki z 5-minutowymi przerwami, wykorzystując naturalny cykl uwagi m\xf3zgu
- Implementacja wymaga codziennej konsystencji przez minimum 80% dni w miesiącu dla osiągnięcia optymalnych rezultat\xf3w`},{role:"user",content:`Create a high-quality, condensed summary focusing on the most essential and actionable insights from these notes. Focus on key concepts, practical techniques, and important mechanisms that students should remember:

${e}`}],max_tokens:400,temperature:.3}),t=n.choices[0]?.message?.content?.trim()||"";if(!t)throw Error("Empty summary generated");return console.log(`[OpenAI] Summary generated successfully (${t.length} characters)`),t}catch(t){if(console.error(`[OpenAI] Error generating summary (attempt ${n+1}):`,t.message),n<2)return console.log(`[OpenAI] Retrying summary generation in ${(n+1)*1e3}ms...`),await r((n+1)*1e3),p(e,n+1);return"Nie udało się wygenerować streszczenia."}}}};