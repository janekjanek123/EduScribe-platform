import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ffmpeg = require('fluent-ffmpeg')

// Set FFmpeg path with better error handling
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  const ffmpegPath = ffmpegInstaller.path;
  
  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('✅ FFmpeg path set:', ffmpegPath);
  } else {
    console.log('⚠️ FFmpeg installer path not found');
  }
} catch (error) {
  console.log('⚠️ FFmpeg installer error, trying alternatives');
  
  // Try the known working path first
  const knownPath = '/Users/janjedrach/Cursor/eduscribe/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg';
  const possiblePaths = [
    knownPath,
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg'
  ];
  
  for (const testPath of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(testPath)) {
        ffmpeg.setFfmpegPath(testPath);
        console.log('✅ Found FFmpeg at:', testPath);
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }
}

interface BrainrotRequest {
  topic?: string
  description: string
  videoBackground: string
  avatar: string
  sourceFile?: File
}

interface BrainrotResponse {
  success: boolean
  videoUrl?: string
  thumbnailUrl?: string
  videoId?: string
  voiceUrl?: string
  subtitlesUrl?: string
  error?: string
}

// Avatar voice mappings for ElevenLabs
const AVATAR_VOICES = {
  'avatar1': process.env.ELEVENLABS_VOICE_1 || 'pNInz6obpgDQGcFmaJgB', // Adam
  'avatar2': process.env.ELEVENLABS_VOICE_2 || 'EXAVITQu4vr4xnSDxMaL', // Bella  
  'avatar3': process.env.ELEVENLABS_VOICE_3 || '21m00Tcm4TlvDq8ikWAM', // Rachel
  'dr.ogur': process.env.ELEVENLABS_DR_OGUR_VOICE || 'pNInz6obpgDQGcFmaJgB', // Dr. Ogur (Polish medical voice)
  'tadzio': process.env.ELEVENLABS_TADZIO_VOICE || 'EXAVITQu4vr4xnSDxMaL', // Tadzio
  'marek': process.env.ELEVENLABS_MAREK_VOICE || '21m00Tcm4TlvDq8ikWAM', // Marek
}

// Cloned voice mappings (will use cloned voices if available)
const CLONED_AVATAR_VOICES = {
  'dr.ogur': 'dr_ogur_cloned',
  'tadzio': 'tadzio_cloned', 
  'marek': 'marek_cloned'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const topic = formData.get('topic') as string
    const description = formData.get('description') as string
    const videoBackground = formData.get('videoBackground') as string
    const avatar = formData.get('avatar') as string
    const sourceFile = formData.get('sourceFile') as File | null

    // Validate required fields - topic is optional
    if ((!description && !sourceFile) || !videoBackground || !avatar) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: (description or file), video background, and avatar' },
        { status: 400 }
      )
    }

    // Process uploaded file if provided
    let extractedText = ''
    if (sourceFile) {
      extractedText = await extractTextFromFile(sourceFile)
    }

    const contentToUse = extractedText || description
    const videoId = `brainrot_${Date.now()}`
    const topicToUse = topic || 'Study Material'

    console.log('🎬 Starting advanced brainrot video generation...')
    console.log(`Topic: ${topicToUse}`)
    console.log(`Background: ${videoBackground}`)
    console.log(`Avatar: ${avatar}`)

    // Create output directory
    const outputDir = path.join(process.cwd(), 'public', 'uploads', 'brainrot')
    await fs.mkdir(outputDir, { recursive: true })

    // Step 1: Generate enhanced script
    const script = await generateEnhancedBrainrotScript(topicToUse, contentToUse, avatar)
    console.log('📝 Enhanced script generated:', script.substring(0, 100) + '...')

    // Step 2: Generate voice using ElevenLabs
    const voiceUrl = await generateVoiceWithElevenLabs(script, avatar, videoId)
    console.log('🎙️ Voice generated:', voiceUrl)

    // Step 3: Get audio duration to determine video length
    const audioDuration = await getAudioDuration(voiceUrl)
    console.log('⏱️ Audio duration:', audioDuration + 's')

    // Step 4: Generate subtitles using script content over audio transcription
    const subtitlesPath = await generateSubtitlesWithScript(voiceUrl, videoId, script, audioDuration)
    console.log('📝 Subtitles generated:', subtitlesPath)

    // Step 5: Create final video with avatar, background, voice, and subtitles
    const videoPath = await createFullBrainrotVideo({
      backgroundId: videoBackground,
      avatarId: avatar,
      voiceUrl,
      subtitlesPath,
      duration: audioDuration,
      videoId,
      script
    })
    console.log('🎥 Final video created:', videoPath)

    // Step 6: Create thumbnail
    const thumbnailPath = await createVideoThumbnail(videoPath, videoId)
    console.log('🖼️ Thumbnail created:', thumbnailPath)

    return NextResponse.json({
      success: true,
      videoUrl: `/uploads/brainrot/${videoId}.mp4`,
      thumbnailUrl: `/uploads/brainrot/${videoId}_thumb.jpg`,
      voiceUrl: `/uploads/brainrot/${videoId}_voice.mp3`,
      subtitlesUrl: `/uploads/brainrot/${videoId}_subtitles.srt`,
      videoId: videoId,
      script: script,
      duration: audioDuration
    })

  } catch (error: any) {
    console.error('❌ Brainrot generation error:', error)
    return NextResponse.json(
      { success: false, error: `Video generation failed: ${error.message}` },
      { status: 500 }
    )
  }
}

// Generate enhanced brainrot script with character-specific styles
async function generateEnhancedBrainrotScript(topic: string, description: string, avatar: string): Promise<string> {
  
  // Dr. Ogur - Polish Medical Style using OpenAI
  if (avatar === 'dr.ogur') {
    console.log('🧬 Dr. Ogur selected - attempting OpenAI generation')
    console.log('📝 Topic:', topic)
    console.log('📝 Description:', description.substring(0, 100) + '...')
    
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found, generating authentic Dr. Ogur rant')
      console.log('🔑 API Key exists:', !!process.env.OPENAI_API_KEY)
      console.log('🔑 API Key length:', process.env.OPENAI_API_KEY.length)
      console.log('🔑 API Key starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...')
      
      try {
        const singlePrompt = `Topic: ${topic}
Material to explain: ${description}

TASK
Generate a **spoken-style Polish rant** by Dr. Ogór.
This text will be used *as subtitles and voice script* in a video.

1️⃣ **Open with:**
Co to kurwa jest ${topic}? (or "Kto to kurwa jest" if about a person)

2️⃣ **Rant rules**
• Explain the material prosto z mostu – krótkie, jasne zdania.
• **VERY VULGAR** - use more crude language, swearing, and sexual references.
• Heavy doctor-themed jokes and comparisons (skalpel, operacja, oddział, narkozia, pacjent, serce, etc.).
• Playful but harsh roasts of the viewer.
• Entirely in Polish, zero angielskich wstawek.
• **Spontaneous** – every answer must feel fresh; no repeated lines or templates.
• Write exactly what the character should say, nothing else.
• Make it cruder and more offensive than typical content.

3️⃣ **Style reference (vibe only – don't copy):**
Co to, kurwa, jest różnica między pępkiem do środka a na zewnątrz? Wszystko zaczyna się, gdy się rodzisz, a lekarz przecina wężyk z sokiem dla bobasa, czyli pępowinę. No i teraz tak – sposób, w jaki twoje ciało się goi, decyduje o tym, czy będziesz mieć słodkiego pępuszka-do-środka, czy odważnie wystający pępek, który ci się przebija przez koszulkę, jakby chciał atencji. Większość ludzi goi się do środka, ładnie i schludnie. Ale jak się zrobi trochę blizny albo ciśnienie wypchnie coś podczas gojenia – bum, pępek na zewnątrz, suko.

Return only the final rant text.`

        console.log('📤 Single prompt length:', singlePrompt.length)
        console.log('🔄 Sending request to OpenAI...')
        
        const requestBody = {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: singlePrompt }
          ],
          max_tokens: 1200,
          temperature: 0.9
        }
        
        console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('📡 OpenAI response status:', response.status)
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (response.ok) {
          const result = await response.json()
          console.log('📥 Full OpenAI response:', JSON.stringify(result, null, 2))
          
          const generatedScript = result.choices?.[0]?.message?.content?.trim()
          
          if (generatedScript && generatedScript.length > 50) {
            console.log('✅ OpenAI generated Dr. Ogur script successfully')
            console.log('📝 Generated script length:', generatedScript.length)
            console.log('📝 Generated script preview:', generatedScript.substring(0, 200) + '...')
            console.log('📝 Script starts with expected phrase:', generatedScript.startsWith('Co to kurwa jest'))
            return generatedScript
          } else {
            console.warn('⚠️ OpenAI returned empty or too short content:', generatedScript)
          }
        } else {
          const errorText = await response.text()
          console.error('❌ OpenAI API error:', response.status, response.statusText)
          console.error('❌ Error response:', errorText)
        }
      } catch (error: any) {
        console.error('❌ OpenAI generation failed for Dr. Ogur:', error)
        console.error('❌ Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        })
      }
    } else {
      console.warn('⚠️ No OpenAI API key found - using enhanced fallback')
      console.warn('⚠️ Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI')))
    }
    
    // COMPLETELY NEW enhanced fallback system for Dr. Ogur
    console.log('🔄 Using enhanced natural Dr. Ogur fallback system')
    
    // Generate truly spontaneous and varied Dr. Ogur content
    const randomStructures = [
      'rambling_explanation',
      'angry_rant', 
      'sarcastic_lecture',
      'crude_comparison',
      'medical_metaphor_heavy'
    ]
    
    const randomStructure = randomStructures[Math.floor(Math.random() * randomStructures.length)]
    const actualTopic = topic && topic !== 'Study Material' ? topic : (description.split(' ').slice(0, 2).join(' ') || 'to gówno')
    
    let script = ''
    
    // Different structures for true variety
    if (randomStructure === 'rambling_explanation') {
      const ramblingOpeners = [
        `Co to kurwa jest ${actualTopic}? No słuchajcie, usiądźcie wygodnie, bo będę wam opowiadał jak dzieciakom.`,
        `${actualTopic}? Oj kurwa, gdzie ja mam zacząć z tym gównem...`,
        `Patrzcie no, ${actualTopic} - kto to wymyślił? Jakiś świrus z uniwersytetu pewnie.`
      ]
      script = ramblingOpeners[Math.floor(Math.random() * ramblingOpeners.length)] + ' '
      
      // Add rambling style content
      const sentences = description.split('.').filter(s => s.trim().length > 0).slice(0, 3)
      sentences.forEach((sentence, index) => {
        let processedSentence = sentence.trim()
          .replace(/\b(był|jest|zostać)\b/gi, 'pierdolił się jako')
          .replace(/opracował|stworzył|wymyślił/gi, 'sklecił jak na kolanie')
          .replace(/uniwersytet/gi, 'ta szkoła dla bogaczy')
        
        script += `${processedSentence}. `
        
        if (index === 1) {
          const randomComments = [
            'I teraz pytanie - po co?',
            'No i chuj z tym, bracie.',
            'Ale czy ktoś się pyta, czy to ma sens?',
            'Typowe dla akademików - robią z muchy słonia.'
          ]
          script += `${randomComments[Math.floor(Math.random() * randomComments.length)]} `
        }
      })
      
      script += `A teraz każdy profesor robi z tego religię i kasuje hajs. Koniec mojego wykładu, idźcie się wyperdolić.`
      
    } else if (randomStructure === 'angry_rant') {
      script = `Co to jest kurwa ${actualTopic}?! Znowu jakiś mądry chuj pomyślał sobie, że wymyśli nową naukę! `
      
      const angrySentences = description.split('.').slice(0, 2)
      angrySentences.forEach(sentence => {
        if (sentence.trim()) {
          script += `${sentence.trim()} - I CO Z TEGO?! `
        }
      })
      
      const angryEndings = [
        'Wszyscy to kurwa wiedzą, ale robią jakby to była jakaś rewelacja!',
        'A potem studenci płacą tysiące za naukę tej oczywistości!',
        'I tak powstają kolejne bezużyteczne katedry na uniwersytetach!'
      ]
      script += angryEndings[Math.floor(Math.random() * angryEndings.length)]
      
    } else if (randomStructure === 'sarcastic_lecture') {
      script = `Och, ${actualTopic}! Jaka fascynująca sprawa! Pozwólcie, że wam opowiem o tym cudzie nauki... `
      
      const sentences = description.split('.').filter(s => s.trim().length > 0).slice(0, 3)
      sentences.forEach((sentence, index) => {
        let sarcasticSentence = sentence.trim()
          .replace(/ważny|istotny|znaczący/gi, 'rzekomo ważny')
          .replace(/rewolucyjny|przełomowy/gi, 'tak zwany "przełomowy"')
        
        script += `${sarcasticSentence}. `
        
        if (index === 1) {
          script += `Wow, jakie to wszystko głębokie i mądre! `
        }
      })
      
      script += `I teraz wszyscy robią z tego wielką naukę. Gratulacje, ludzkości, kolejny sposób na marnowanie czasu!`
      
    } else if (randomStructure === 'crude_comparison') {
      const crudeComparisons = [
        `${actualTopic} to jak operacja żółci - wszyscy myślą, że to ważne, ale w sumie można bez tego żyć.`,
        `${actualTopic} przypomina mi mojego ostatniego pacjenta - dużo hałasu, mało treści.`,
        `To jest jak rak prostaty - brzmi poważnie, ale większość facetów i tak tego nie ogarnia.`
      ]
      script = `Co to kurwa jest ${actualTopic}? ` + crudeComparisons[Math.floor(Math.random() * crudeComparisons.length)] + ' '
      
      const shortDesc = description.split('.')[0]
      script += `${shortDesc}. I to ma być nauka? Moja babcia robiła lepsze diagnozy niż ci wszyscy profesorowie razem wzięci.`
      
    } else { // medical_metaphor_heavy
      const medicalMetaphors = [
        'jak zakażenie w ranie - rozprzestrzenia się, ale nikt nie wie po co',
        'jak guz na mózgu - duży, ale bezużyteczny',
        'jak kamica nerkowa - boli i trudne do usunięcia',
        'jak wirus - łatwo się rozprzestrzenia wśród głupich'
      ]
      
      script = `Co to kurwa jest ${actualTopic}? To jest ${medicalMetaphors[Math.floor(Math.random() * medicalMetaphors.length)]}. `
      
      const sentences = description.split('.').slice(0, 2)
      sentences.forEach(sentence => {
        if (sentence.trim()) {
          script += `${sentence.trim()}. `
        }
      })
      
      script += `A teraz każdy uważa się za eksperta. Jak w szpitalu - każdy ma opinię o medycynie, ale nikt nie chce zostać doktorem.`
    }
    
    console.log('✅ Generated truly spontaneous Dr. Ogur script with structure:', randomStructure)
    console.log('📝 Script length:', script.length)
    console.log('📝 Script preview:', script.substring(0, 150) + '...')
    
    return script
  }

  // Tadzio - Polish Mechanic Style using OpenAI
  if (avatar === 'tadzio') {
    console.log('🚗 Tadzio selected - attempting OpenAI generation')
    console.log('📝 Topic:', topic)
    console.log('📝 Description:', description.substring(0, 100) + '...')
    
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found, generating authentic Tadzio rant')
      
      try {
        // Extract actual topic from description if topic is "Study Material"
        const actualTopic = topic === 'Study Material' ? 
          (description.match(/(?:o |na temat |dotyczący |temat: )([^.,!?]+)/i)?.[1] || 
           description.split(' ').slice(0, 2).join(' ')) : topic
        
        const singlePrompt = `Topic: ${actualTopic}
Material to explain: ${description}

TASK
Generate a **spoken-style Polish rant** by Tadzio (car mechanic character).
This text will be used *as subtitles and voice script* in a video.

1️⃣ **Mandatory opener:**
Mówisz „${actualTopic}"? Jestem Tadzio i już ci to tłumaczę…

2️⃣ **Tone & rules:**
• Polish only.
• Lightly vulgar, warm "garage" vibe.
• Heavy use of car/mechanic metaphors and jokes (maluch, Passat, silnik, skrzynia, LPG, itp.).
• Occasional playful roasts of the viewer (e.g. „masz łeb jak elektronika w maluchu – nic tam nie styka").
• Short, punchy sentences; no rigid template — every rant must feel fresh and spontaneous.
• Explain the material as simply as possible, like you'd explain to kumple przy piwie.

3️⃣ **Style reference (vibe only — do NOT copy verbatim):**
Mówisz „fotosynteza"? Jestem Tadzio i już ci to tłumaczę…
Wyobraź sobie roślinę jak Passata w wersji bio-hybryda. Zamiast baku ma liście-panele słoneczne. Wystarczy trochę słońca i ten zielony skurczybyk zaczyna się ładować: wciąga CO₂, zaciąga wodę spod kół, miesza to w chloroplaście — swojej komorze spalania — i przerabia na glukozę, żeby nie paść jak akumulator zimą. Przy okazji wypluwa tlen, żebyśmy nie udusili się w swoich rzęchach w korku.
Chlorofil? To taki zielony lakier, odbija światło lepiej niż matowy wrap i napędza całą reakcję. Bez niego fotosynteza stoi jak Golf na pustym baku.
Więc następnym razem, jak ktoś gada, że rośliny „tylko stoją", powiedz mu, że każdy liść to mała słoneczna ładowarka, która cię karmi i ratuje tyłek na każdym wdechu. Proste jak maska Passata — i wcale się tak nie pierdoli.

4️⃣ **Output:**
Return **only** the final spoken-style rant for subtitles / voice-over.`

        console.log('📤 Tadzio prompt length:', singlePrompt.length)
        console.log('🔄 Sending request to OpenAI...')
        
        const requestBody = {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: singlePrompt }
          ],
          max_tokens: 1200,
          temperature: 0.9
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('📡 OpenAI response status:', response.status)
        
        if (response.ok) {
          const result = await response.json()
          const generatedScript = result.choices?.[0]?.message?.content?.trim()
          
          if (generatedScript && generatedScript.length > 50) {
            console.log('✅ OpenAI generated Tadzio script successfully')
            console.log('📝 Generated script length:', generatedScript.length)
            console.log('📝 Generated script preview:', generatedScript.substring(0, 200) + '...')
            return generatedScript
          } else {
            console.warn('⚠️ OpenAI returned empty or too short content:', generatedScript)
          }
        } else {
          const errorText = await response.text()
          console.error('❌ OpenAI API error:', response.status, response.statusText)
          console.error('❌ Error response:', errorText)
        }
      } catch (error: any) {
        console.error('❌ OpenAI generation failed for Tadzio:', error)
      }
    } else {
      console.warn('⚠️ No OpenAI API key found - using Tadzio fallback')
    }
    
    // Tadzio fallback system
    console.log('🔄 Using Tadzio mechanic fallback system')
    
    // Extract actual topic from description if topic is "Study Material"
    const actualTopic = topic === 'Study Material' ? 
      (description.match(/(?:o |na temat |dotyczący |temat: )([^.,!?]+)/i)?.[1] || 
       description.split(' ').slice(0, 2).join(' ') || 'to') : topic
    
    let script = `Mówisz „${actualTopic}"? Jestem Tadzio i już ci to tłumaczę… `
    
    // Car metaphor explanations
    const carMetaphors = [
      'To jak silnik w maluchu - proste, ale czasem się psuje.',
      'Wyobraź sobie to jak skrzynię biegów - albo działa, albo nie.',
      'To jest jak elektronika w Passacie - skomplikowane, ale da się ogarnąć.',
      'Jak LPG w starym golfie - brzmi dziwnie, ale oszczędza.'
    ]
    
    const randomMetaphor = carMetaphors[Math.floor(Math.random() * carMetaphors.length)]
    script += randomMetaphor + ' '
    
    // Process description with car terms
    const sentences = description.split('.').filter(s => s.trim().length > 0).slice(0, 3)
    sentences.forEach((sentence, index) => {
      let carSentence = sentence.trim()
        .replace(/działa|funkcjonuje/gi, 'chodzi jak dobrze nastrojony silnik')
        .replace(/system|mechanizm/gi, 'układ')
        .replace(/proces/gi, 'cykl roboczy')
        .replace(/energia/gi, 'moc')
      
      script += `${carSentence}. `
      
      if (index === 1) {
        script += 'Masz łeb jak elektronika w maluchu – nic tam nie styka, ale jakoś działa. '
      }
    })
    
    script += 'Proste jak maska w Passacie — i wcale się tak nie pierdoli.'
    
    console.log('✅ Generated Tadzio mechanic script')
    console.log('📝 Script preview:', script.substring(0, 150) + '...')
    
    return script
  }
  
  // Marek - Polish News Anchor Style using OpenAI
  if (avatar === 'marek') {
    console.log('📺 Marek selected - attempting OpenAI generation')
    console.log('📝 Topic:', topic)
    console.log('📝 Description:', description.substring(0, 100) + '...')
    
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found, generating authentic Marek news segment')
      
      try {
        // Extract actual topic from description if topic is "Study Material"
        const actualTopic = topic === 'Study Material' ? 
          (description.match(/(?:o |na temat |dotyczący |temat: )([^.,!?]+)/i)?.[1] || 
           description.split(' ').slice(0, 2).join(' ')) : topic
        
        const singlePrompt = `Topic: ${actualTopic}
Material to explain: ${description}

TASK
Generate a **spoken-style Polish news segment** by Marek (sarcastic news anchor character).
This text will be used *as subtitles and voice script* in a video.

1️⃣ **Mandatory opener:**
Dzień dobry państwu, jestem Marek, a to newsy o ${actualTopic}.

2️⃣ **Tone & rules:**
• Polish only.
• Slightly vulgar, ironic tone — like a sarcastic news anchor on caffeine.
• Use pop-culture and celeb-world comparisons (influencerzy, dramy, botoks, celebryci, reality show, itp.).
• Juicy storytelling style — like an over-the-top commentary show.
• Occasional playful jabs and roast-style lines ("rozjechani jak reputacja po udziale w Fame MMA").
• Short, dynamic sentences — feels like a tabloid TV segment, not an academic lecture.
• No fixed template — every rant must feel fresh, improvised, and like it's being spoken live.
• END with "Dobranoc państwu!" instead of mentioning next episodes.

3️⃣ **Style reference (vibe only — do NOT copy verbatim):**
Dzień dobry państwu, jestem Marek, a to newsy o największym średniowiecznym wpierdolu, czyli Bitwie pod Grunwaldem.
Krzyżacy przyszli, zbroje wypolerowane, dumni jak celebryta w dresie na gali rozdania nagród.
A potem zostali rozsmarowani po polu jak botoks po twarzy influencerki po rozwodzie.
Z jednej strony Jagiełło — król-menedżer z planem. Z drugiej — Ulrich, chłop co myślał, że jeszcze zdąży na aftera.
Wyszło jak wyszło: historia zrobiła content, a my tylko zacieramy ręce. Dobranoc państwu!

4️⃣ **Output:**
Return **only** the final spoken-style news segment for subtitles / voice-over.`

        console.log('📤 Marek prompt length:', singlePrompt.length)
        console.log('🔄 Sending request to OpenAI...')
        
        const requestBody = {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: singlePrompt }
          ],
          max_tokens: 1200,
          temperature: 0.9
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('📡 OpenAI response status:', response.status)
        
        if (response.ok) {
          const result = await response.json()
          const generatedScript = result.choices?.[0]?.message?.content?.trim()
          
          if (generatedScript && generatedScript.length > 50) {
            console.log('✅ OpenAI generated Marek script successfully')
            console.log('📝 Generated script length:', generatedScript.length)
            console.log('📝 Generated script preview:', generatedScript.substring(0, 200) + '...')
            return generatedScript
          } else {
            console.warn('⚠️ OpenAI returned empty or too short content:', generatedScript)
          }
        } else {
          const errorText = await response.text()
          console.error('❌ OpenAI API error:', response.status, response.statusText)
          console.error('❌ Error response:', errorText)
        }
      } catch (error: any) {
        console.error('❌ OpenAI generation failed for Marek:', error)
      }
    } else {
      console.warn('⚠️ No OpenAI API key found - using Marek fallback')
    }
    
    // Marek fallback system
    console.log('🔄 Using Marek news anchor fallback system')
    
    // Extract actual topic from description if topic is "Study Material"
    const actualTopic = topic === 'Study Material' ? 
      (description.match(/(?:o |na temat |dotyczący |temat: )([^.,!?]+)/i)?.[1] || 
       description.split(' ').slice(0, 2).join(' ') || 'ta sprawa') : topic
    
    let script = `Dzień dobry państwu, jestem Marek, a to newsy o ${actualTopic}. `
    
    // Pop culture comparisons
    const popCultureComparisons = [
      'To drama jak z reality show - dużo krzyku, mało sensu.',
      'Sprawa tak skomplikowana jak relacje w Big Brotherze.',
      'Historia bardziej pokręcona niż plotki o celebrytach.',
      'Sytuacja gorsza niż reputacja po udziale w Fame MMA.'
    ]
    
    const randomComparison = popCultureComparisons[Math.floor(Math.random() * popCultureComparisons.length)]
    script += randomComparison + ' '
    
    // Process description with pop culture terms
    const sentences = description.split('.').filter(s => s.trim().length > 0).slice(0, 3)
    sentences.forEach((sentence, index) => {
      let newsSentence = sentence.trim()
        .replace(/ważny|istotny/gi, 'jak botoks dla influencerki')
        .replace(/duży|wielki/gi, 'większy niż ego celebryty')
        .replace(/problem|kłopot/gi, 'drama')
        .replace(/konflikt/gi, 'beef')
      
      script += `${newsSentence}. `
      
      if (index === 1) {
        script += 'Rozjechani jak reputacja po aferze na Instagramie. '
      }
    })
    
    script += 'Historia zrobiła content, a my tylko zacieramy ręce. Dobranoc państwu!'
    
    console.log('✅ Generated Marek news anchor script')
    console.log('📝 Script preview:', script.substring(0, 150) + '...')
    
    return script
  }
  
  // Default Brainrot Style for other avatars
  const brainrotOpeners = [
    "Yo what's good fam! This is absolutely INSANE!",
    "HOLD UP! You're not gonna believe this!",
    "Bro, this is about to blow your mind!",
    "Listen up! This knowledge is straight FIRE!",
    "Wait wait wait... This is actually CRAZY!"
  ]
  
  const brainrotTransitions = [
    "But here's the thing that's gonna make you go BRRRR...",
    "And this next part is where it gets SPICY...",
    "Now THIS is where things get interesting...",
    "But wait, there's MORE! This is gonna be BUSSIN...",
    "Hold on to your seats because this next part is MENTAL..."
  ]
  
  const brainrotClosers = [
    "And THAT'S how you become the smartest person in the room! Let's GOOO! 🔥",
    "This knowledge is gonna make you UNSTOPPABLE! Drop that W in the chat! 💯",
    "You just leveled up your brain! This content is ELITE! 🧠⚡",
    "Knowledge is POWER and you just got SUPERPOWERS! Let's get it! 🚀",
    "Your brain just got an UPGRADE! This is the content that changes EVERYTHING! 🎯"
  ]
  
  const opener = brainrotOpeners[Math.floor(Math.random() * brainrotOpeners.length)]
  const transition = brainrotTransitions[Math.floor(Math.random() * brainrotTransitions.length)]
  const closer = brainrotClosers[Math.floor(Math.random() * brainrotClosers.length)]
  
  // Create engaging script with proper pacing
  let script = `${opener} Today we're diving DEEP into ${topic}! `
  
  // Add main content with engaging language
  const mainContent = description
    .replace(/\./g, '! This is CRUCIAL! ')
    .replace(/,/g, ' - and listen to this - ')
    .replace(/;/g, '! BUT WAIT! ')
  
  script += `${mainContent} ${transition} `
  script += `This is the type of knowledge that separates the LEGENDS from everyone else! `
  script += closer
  
  return script
}

// Generate voice using cloned voices or ElevenLabs API
async function generateVoiceWithElevenLabs(text: string, avatarId: string, videoId: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}_voice.mp3`)
  
  // TEMPORARILY DISABLED - Voice cloning has Python compatibility issues
  // Will be re-enabled once TTS library is fixed for Python 3.9
  console.log(`🎙️ Voice cloning temporarily disabled, using ElevenLabs for avatar: ${avatarId}`)
  
  // TODO: Re-enable when TTS works with Python 3.9
  // const clonedVoiceName = CLONED_AVATAR_VOICES[avatarId as keyof typeof CLONED_AVATAR_VOICES]
  // if (clonedVoiceName && process.env.VOICE_CLONING_SERVICE_URL) { ... }
  
  // Fallback to ElevenLabs
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('⚠️ ElevenLabs API key not found, creating text-to-speech fallback')
    // Create a proper silent audio file as fallback
    return await createSilentAudio(outputPath, 30) // 30 second silent audio
  }
  
  try {
    console.log(`🎙️ Using ElevenLabs voice for avatar: ${avatarId}`)
    const voiceId = AVATAR_VOICES[avatarId as keyof typeof AVATAR_VOICES] || AVATAR_VOICES.avatar1
    
    // Use different settings for Polish voices (Dr. Ogur, Tadzio, Marek)
    const isPolishVoice = ['dr.ogur', 'tadzio', 'marek'].includes(avatarId)
    const voiceSettings = isPolishVoice ? {
      stability: 0.7,
      similarity_boost: 0.9,
      style: 0.8,
      use_speaker_boost: true
    } : {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.6,
      use_speaker_boost: true
    }
    
    const modelId = isPolishVoice ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1'
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings
      })
    })
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }
    
    const audioBuffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(audioBuffer))
    
    console.log('✅ ElevenLabs voice generated successfully')
    return outputPath
    
  } catch (error) {
    console.error('❌ ElevenLabs generation failed:', error)
    // Fallback: create silent audio
    return await createSilentAudio(outputPath, 30)
  }
}

// Create silent audio file as fallback
async function createSilentAudio(outputPath: string, duration: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = '/Users/janjedrach/Cursor/eduscribe/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'
    const { spawn } = require('child_process')
    
    const ffmpegProcess = spawn(ffmpegPath, [
      '-f', 'lavfi',
      '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,
      '-t', duration.toString(),
      '-c:a', 'mp3',
      '-b:a', '128k',
      '-y',
      outputPath
    ])
    
    ffmpegProcess.on('close', (code: number) => {
      if (code === 0) {
        console.log('✅ Silent audio created as fallback')
        resolve(outputPath)
      } else {
        console.error('❌ Failed to create silent audio')
        reject(new Error('Silent audio creation failed'))
      }
    })
  })
}

// Convert WAV to MP3 using ffmpeg
async function convertWavToMp3(wavPath: string, mp3Path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = '/Users/janjedrach/Cursor/eduscribe/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'
    const { spawn } = require('child_process')
    
    const ffmpegProcess = spawn(ffmpegPath, [
      '-i', wavPath,
      '-c:a', 'mp3',
      '-b:a', '128k',
      '-y',
      mp3Path
    ])
    
    ffmpegProcess.on('close', (code: number) => {
      if (code === 0) {
        console.log('✅ WAV converted to MP3 successfully')
        resolve()
      } else {
        console.error('❌ Failed to convert WAV to MP3')
        reject(new Error('WAV to MP3 conversion failed'))
      }
    })
  })
}

// Generate subtitles - prioritize script content over audio transcription
async function generateSubtitlesWithScript(audioPath: string, videoId: string, script: string, duration: number): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}_subtitles.srt`)
  
  try {
    // Check if we have actual voice audio (not silent)
    const stats = await fs.stat(audioPath)
    const isLikelyVoiceAudio = stats.size > 50000 && process.env.ELEVENLABS_API_KEY // >50KB and API key present
    
    if (isLikelyVoiceAudio && process.env.OPENAI_API_KEY) {
      console.log('🎙️ Detected voice audio, using Whisper for transcription')
      
      const formData = new FormData()
      const audioBuffer = await fs.readFile(audioPath)
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      
      formData.append('file', audioBlob, `${videoId}_voice.mp3`)
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'srt')
      formData.append('language', 'en')
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      })
      
      if (response.ok) {
        const srtContent = await response.text()
        await fs.writeFile(outputPath, srtContent)
        console.log('✅ Whisper subtitles generated successfully')
        return outputPath
      }
    }
    
    // Use script-based subtitles (shows actual content)
    console.log('📝 Using script-based subtitles for full content display')
    console.log('📝 Script length:', script.length, 'characters')
    console.log('📝 Video duration:', duration, 'seconds')
    return await createScriptBasedSubtitles(script, videoId, duration)
    
  } catch (error) {
    console.error('❌ Subtitle generation failed, using script-based subtitles:', error)
    return await createScriptBasedSubtitles(script, videoId, duration)
  }
}

// Create script-based subtitles - displays the actual generated script
async function createScriptBasedSubtitles(script: string, videoId: string, duration: number): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}_subtitles.srt`)
  
  // Split script into words for word-by-word display
  const words = script.split(' ').filter(word => word.length > 0)
  const totalWords = words.length
  const wordsPerSecond = Math.max(2, totalWords / duration) // At least 2 words per second
  
  let srtContent = ''
  let wordIndex = 0
  let startTime = 0
  
  // Create subtitle segments showing 3-5 words at a time
  while (wordIndex < totalWords) {
    const segmentWords = words.slice(wordIndex, wordIndex + 4) // 4 words per segment
    const segmentDuration = segmentWords.length / wordsPerSecond
    const endTime = startTime + segmentDuration
    
    const segmentNumber = Math.floor(wordIndex / 4) + 1
    const startTimeFormatted = formatTime(startTime)
    const endTimeFormatted = formatTime(Math.min(endTime, duration))
    
    srtContent += `${segmentNumber}
${startTimeFormatted} --> ${endTimeFormatted}
${segmentWords.join(' ')}

`
    
    wordIndex += 4
    startTime = endTime
    
    if (startTime >= duration) break
  }
  
  await fs.writeFile(outputPath, srtContent, 'utf8')
  console.log('✅ Script-based subtitles created with', Math.floor(wordIndex / 4), 'segments')
  return outputPath
}

// Format time for SRT format (HH:MM:SS,mmm)
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
}

// Create manual subtitles as fallback
async function createManualSubtitles(audioPath: string, videoId: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}_subtitles.srt`)
  
  // Create basic timed subtitles with proper SRT formatting
  const srtContent = `1
00:00:00,000 --> 00:00:05,000
🔥 BRAINROT STUDY TIME 🔥

2
00:00:05,000 --> 00:00:10,000
This content is absolutely FIRE!

3
00:00:10,000 --> 00:00:15,000
Get ready to level up your brain!

4
00:00:15,000 --> 00:00:20,000
Knowledge is POWER! Let's GO! 💯

5
00:00:20,000 --> 00:00:25,000
Study mode: ACTIVATED!

6
00:00:25,000 --> 00:00:30,000
Brain = UPGRADED! 🧠✨
`
  
  await fs.writeFile(outputPath, srtContent, 'utf8')
  console.log('✅ Manual subtitles created')
  return outputPath
}

// Get audio duration
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
      if (err) {
        console.log('⚠️ Could not get audio duration, defaulting to 30s')
        resolve(30) // Default fallback
        return
      }
      
      const duration = metadata.format.duration || 30
      resolve(Math.ceil(duration))
    })
  })
}

// Create full brainrot video with all components
async function createFullBrainrotVideo(options: {
  backgroundId: string
  avatarId: string  
  voiceUrl: string
  subtitlesPath: string
  duration: number
  videoId: string
  script: string
}): Promise<string> {
  const { backgroundId, avatarId, voiceUrl, subtitlesPath, duration, videoId } = options
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}.mp4`)
  
  // Get asset paths
  const backgroundPath = getBackgroundVideoPath(backgroundId)
  const avatarPath = getAvatarImagePath(avatarId)
  
  return new Promise((resolve, reject) => {
    console.log('🎬 Creating full brainrot video with all components...')
    console.log('Background:', backgroundPath)
    console.log('Avatar:', avatarPath)
    console.log('Voice:', voiceUrl)
    console.log('Subtitles:', subtitlesPath)
    console.log('Duration:', duration + 's')
    
    // Escape subtitle path for FFmpeg
    const escapedSubtitlesPath = subtitlesPath.replace(/'/g, "'\\''").replace(/:/g, '\\:')
    
    // Character-specific subtitle styling
    let subtitleStyle = ''
    if (avatarId === 'dr.ogur') {
      // Dr. Ogur - Red, bold, bouncing medical style
      subtitleStyle = `FontName=Arial Black,FontSize=52,PrimaryColour=&H0000FF,OutlineColour=&H000000,BackColour=&H80000000,Outline=4,Shadow=3,Bold=1,Alignment=2,MarginV=50`
    } else if (avatarId === 'marek') {
      // Marek - Blue news anchor style, professional yet flashy
      subtitleStyle = `FontName=Arial Black,FontSize=50,PrimaryColour=&HFF8000,OutlineColour=&H000000,BackColour=&H80000000,Outline=4,Shadow=2,Bold=1,Alignment=2,MarginV=55`
    } else if (avatarId === 'tadzio') {
      // Tadzio - Orange mechanic style, warm and friendly
      subtitleStyle = `FontName=Arial,FontSize=46,PrimaryColour=&H00A5FF,OutlineColour=&H000000,BackColour=&H80000000,Outline=3,Shadow=2,Bold=1,Alignment=2,MarginV=65`
    } else {
      // Default brainrot style
      subtitleStyle = `FontName=Arial,FontSize=48,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=4,Bold=1,Alignment=2,MarginV=60`
    }
    
    // Character-specific avatar scaling
    let avatarScale = ''
    if (avatarId === 'dr.ogur') {
      // Dr. Ogur - 1.3× current size
      avatarScale = '[1:v]scale=1196:2015[avatar]'
    } else if (avatarId === 'tadzio') {
      // Tadzio - 1.7× current size
      avatarScale = '[1:v]scale=1564:2635[avatar]'
    } else if (avatarId === 'marek') {
      // Marek - 1.2× current size
      avatarScale = '[1:v]scale=1104:1860[avatar]'
    } else {
      // Default size for other avatars
      avatarScale = '[1:v]scale=920:1550[avatar]'
    }

    // Create video with character-specific avatar scaling and subtitle styling
    ffmpeg()
      .input(backgroundPath)
      .input(avatarPath)
      .input(voiceUrl)
        .videoCodec('libx264')
        .audioCodec('aac')
      .complexFilter([
        // Scale background to 9:16
        '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]',
        // Scale avatar with character-specific sizing
        avatarScale,
        // Overlay avatar on background - positioned lower to hide cropped edges
        '[bg][avatar]overlay=(W-w)/2:H-h+50[video_with_avatar]',
        // Burn subtitles into the video with character-specific styling
        `[video_with_avatar]subtitles='${escapedSubtitlesPath}':force_style='${subtitleStyle}'[final]`
      ])
      .outputOptions([
        '-map [final]',
        '-map 2:a',
        '-preset fast',
        '-crf 23',
        '-r 30',
        `-t ${duration}`
      ])
        .output(outputPath)
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg command:', commandLine)
        })
        .on('progress', (progress: any) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}%`)
        }
        })
        .on('end', () => {
        console.log('✅ Full brainrot video creation completed')
          resolve(outputPath)
        })
        .on('error', (err: any) => {
        console.error('❌ Full video creation failed:', err.message)
        console.log('🔍 Subtitle path:', subtitlesPath)
        console.log('🔍 Escaped path:', escapedSubtitlesPath)
        console.log('🔄 Falling back to simple video creation...')
        
        // Fallback: create simple video with larger avatar but no subtitles
        createSimpleBrainrotVideoLargeAvatar(backgroundId, avatarId, voiceUrl, duration, videoId)
          .then(() => {
            console.log('✅ Fallback video created successfully')
            resolve(outputPath)
          })
          .catch((fallbackErr) => {
            console.error('❌ Fallback also failed:', fallbackErr)
            reject(fallbackErr)
          })
        })
        .run()
  })
}

// Simplified fallback video creation with larger avatar
async function createSimpleBrainrotVideoLargeAvatar(
  backgroundId: string, 
  avatarId: string, 
  voiceUrl: string, 
  duration: number, 
  videoId: string
): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}.mp4`)
  const backgroundPath = getBackgroundVideoPath(backgroundId)
  const avatarPath = getAvatarImagePath(avatarId)
  
  return new Promise((resolve, reject) => {
    console.log('🔄 Creating simplified video with large avatar...')
    
    // Character-specific avatar scaling for fallback
    let avatarScale = ''
    if (avatarId === 'dr.ogur') {
      // Dr. Ogur - 1.3× current size
      avatarScale = '[1:v]scale=1196:2015[avatar]'
    } else if (avatarId === 'tadzio') {
      // Tadzio - 1.7× current size
      avatarScale = '[1:v]scale=1564:2635[avatar]'
    } else if (avatarId === 'marek') {
      // Marek - 1.2× current size
      avatarScale = '[1:v]scale=1104:1860[avatar]'
    } else {
      // Default size for other avatars
      avatarScale = '[1:v]scale=920:1550[avatar]'
    }
    
    ffmpeg()
      .input(backgroundPath)
      .input(avatarPath) 
      .input(voiceUrl)
      .videoCodec('libx264')
      .audioCodec('aac')
      .complexFilter([
        // Scale background to 9:16
        '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg]',
        // Scale avatar with character-specific sizing
        avatarScale,
        // Overlay avatar on background
        '[bg][avatar]overlay=(W-w)/2:H-h+50[final]'
      ])
      .outputOptions([
        '-map [final]',
        '-map 2:a',
        '-preset fast',
        '-crf 23',
        '-r 30',
        `-t ${duration}`
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('✅ Simplified large avatar video creation completed')
        resolve(outputPath)
      })
      .on('error', (err: any) => {
        console.error('❌ Simplified video creation failed:', err)
        reject(err)
      })
      .run()
  })
}

// Create video thumbnail
async function createVideoThumbnail(videoPath: string, videoId: string): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'uploads', 'brainrot', `${videoId}_thumb.jpg`)
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: path.dirname(outputPath),
        filename: path.basename(outputPath),
        timemarks: ['50%']
      })
      .on('end', () => {
        console.log('✅ Video thumbnail created')
        resolve(outputPath)
      })
      .on('error', (err: any) => {
        console.error('❌ Thumbnail creation failed:', err)
        // Create placeholder thumbnail
        fs.writeFile(outputPath, Buffer.from('placeholder'))
          .then(() => resolve(outputPath))
          .catch(reject)
      })
  })
}

// Get background video file path
function getBackgroundVideoPath(backgroundId: string): string {
  const backgroundMap: Record<string, string> = {
    'background1': 'copy_B20C53E2-8B14-49DC-8F33-1F86EDEFAD2C.MOV',
    'background2': 'copy_A625A3E7-BF73-4C23-94CB-9AC044ED8460.MOV', 
    'background3': 'copy_592628F3-44A6-4877-AAF3-B8F23C22C278.MOV'
  }
  
  const filename = backgroundMap[backgroundId] || backgroundMap['background1']
  return path.join(process.cwd(), 'public', 'assets', 'brainrot', 'backgrounds', filename)
}

// Get avatar image path
function getAvatarImagePath(avatarId: string): string {
  const avatarMap: Record<string, string> = {
    'avatar1': 'IMG_6079-removebg-preview.png',
    'avatar2': 'IMG_6078-removebg-preview.png',
    'avatar3': 'IMG_6077-removebg-preview.png',
    'dr.ogur': 'IMG_6079-removebg-preview.png', // Dr. Ogur - matches avatar manifest
    'tadzio': 'IMG_6078-removebg-preview.png', // Tadzio
    'marek': 'IMG_6077-removebg-preview.png', // Marek - matches avatar manifest
  }
  
  const filename = avatarMap[avatarId] || avatarMap['avatar1']
  return path.join(process.cwd(), 'public', 'assets', 'brainrot', 'avatars', filename)
}

// Extract text from uploaded files (simplified)
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  if (file.type === 'text/plain') {
    return buffer.toString('utf-8')
  }
  
  // For other file types, return placeholder
  return `[Content extracted from ${file.name}]`
} 