# EduScribe - Generator Notatek AI z Filmów YouTube

EduScribe to aplikacja internetowa, która wykorzystuje sztuczną inteligencję do generowania ustrukturyzowanych notatek edukacyjnych z filmów YouTube. Aplikacja jest zoptymalizowana dla języka polskiego i skierowana do uczniów, studentów i nauczycieli.

## Funkcje

- **Generowanie Notatek**: Wklej link do filmu YouTube i otrzymaj automatycznie wygenerowane notatki.
- **Różne Formaty**: Dostępne formaty to TL;DR (streszczenie), pełne notatki oraz quiz.
- **Optymalizacja pod Język Polski**: Wszystkie notatki są generowane w języku polskim z uwzględnieniem specyfiki naszego języka.
- **Model Freemium**: Darmowy dostęp do podstawowych funkcji z możliwością rozszerzenia w planie PRO.

## Technologie

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Autentykacja**: Firebase Authentication
- **Baza danych**: Firebase Firestore
- **AI**: OpenAI API (GPT-3.5-turbo) / Claude API
- **Transkrypcja**: YouTube Captions API

## Wymagania

- Node.js (v18 lub nowszy)
- Yarn lub npm
- Konto Firebase (dla autentykacji i bazy danych)
- Klucze API dla OpenAI lub Claude
- Klucz API YouTube Data API (opcjonalnie)

## Instalacja

1. Sklonuj repozytorium:
   ```
   git clone https://github.com/twoj-username/eduscribe.git
   cd eduscribe
   ```

2. Zainstaluj zależności:
   ```
   npm install
   ```
   lub
   ```
   yarn install
   ```

3. Skopiuj plik `.env.local.example` do `.env.local` i uzupełnij zmienne środowiskowe:
   ```
   cp .env.local.example .env.local
   ```

4. Uruchom aplikację w trybie deweloperskim:
   ```
   npm run dev
   ```
   lub
   ```
   yarn dev
   ```

5. Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

## Struktura Projektu

- `/src/app` - Strony aplikacji (Next.js App Router)
- `/src/components` - Komponenty wielokrotnego użytku
- `/src/lib` - Biblioteki i konfiguracje (Firebase, itp.)
- `/src/services` - Usługi (YouTube API, AI, itp.)
- `/src/models` - Modele danych i interfejsy

## Plany PRO i Free

### Plan Free
- 5 notatek miesięcznie
- Podstawowe notatki w języku polskim
- Tryby TL;DR i pełne notatki
- Brak możliwości eksportu (tylko kopiowanie)
- Brak zapisywania historii

### Plan PRO
- Nieograniczona liczba notatek
- Wszystkie tryby notatek (TL;DR, pełne notatki, quiz)
- Eksport do PDF i DOCX
- Historia i organizacja notatek w foldery
- Możliwość przesyłania własnych plików audio/video
- Brak reklam
- Priorytetowe wsparcie

## Licencja

Ten projekt jest objęty licencją MIT - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## YouTube Subtitle Support

### ⚠️ REQUIRED: yt-dlp for YouTube Subtitle Extraction

EduScribe **requires** `yt-dlp` to download and process YouTube subtitles. The system no longer uses `ytdl-core` as a fallback because it fails consistently due to YouTube's obfuscated signatures and frequent API changes.

**You must install yt-dlp on your system for YouTube video processing to work.**

### Installing yt-dlp

#### macOS

Using Homebrew (recommended):
```bash
brew install yt-dlp
```

Using pip:
```bash
pip install yt-dlp
```

#### Windows

Using pip (recommended):
```bash
pip install yt-dlp
```

Using Chocolatey:
```bash
choco install yt-dlp
```

#### Linux

Using apt (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install yt-dlp
```

Using pip:
```bash
pip install yt-dlp
```

### Verifying Installation

To verify that yt-dlp is installed correctly, run:
```bash
yt-dlp --version
```

You should see the version number printed in your terminal.

### Troubleshooting

If you see errors like "This system requires yt-dlp to extract YouTube subtitles" when processing videos, it means:

1. yt-dlp is not installed on your system, or
2. yt-dlp is not available in your system PATH

Follow the installation instructions above to resolve the issue. After installing, restart the application.

## YouTube Subtitle Extraction

EduScribe now supports subtitle extraction from YouTube videos to generate notes even when the YouTube transcript API doesn't provide transcripts. This feature uses `yt-dlp` to download subtitle files and extract the text.

### Setup

To use the subtitle extraction feature, you need to have `yt-dlp` installed on your system.

Run the following command to install it:

```bash
npm run install-yt-dlp
```

Or install it manually:

- **macOS**: `brew install yt-dlp`
- **Linux/macOS** (alternative): `pip install yt-dlp`
- **Windows**: `pip install yt-dlp` or `choco install yt-dlp`

### Testing Subtitle Extraction

You can test the subtitle extraction with a YouTube URL:

```bash
npm run test-subtitles -- https://www.youtube.com/watch?v=VIDEOID
```

### More Information

For detailed information about the subtitle extraction system, see [SUBTITLE_EXTRACTION.md](SUBTITLE_EXTRACTION.md).

# EduScribe - System Isolation Architecture

## Overview

EduScribe is a Next.js application that generates educational notes from different sources (YouTube videos, uploaded files, and raw text) using AI. This repository showcases a robust system isolation architecture that prevents cascading failures and improves overall reliability.

## The Problem

Previously, all three note generation systems (video, file, text) were tightly coupled, sharing:
- A single database table
- Common API routes
- Shared frontend components and state

This led to reliability issues where failures in one system would cascade to others, causing the entire application to fail.

## The Solution: System Isolation

We've implemented a complete system isolation approach with:

1. **Database Isolation**
   - Each system has its own dedicated table
   - `video_notes` - For YouTube video notes
   - `file_notes` - For uploaded file notes  
   - `text_notes` - For raw text input notes

2. **API Isolation**
   - Dedicated API routes for each system
   - `/api/video-notes` - For processing YouTube videos
   - `/api/file-notes` - For processing uploaded files
   - `/api/text-notes` - For processing raw text

3. **Frontend Isolation**
   - Separate React hooks for each system
   - Dedicated UI components
   - Independent error handling

4. **Comprehensive Health Checks**
   - `/api/health` endpoint monitors all systems independently
   - Verifies dependencies for each system

## Architecture Benefits

This isolation approach provides several key benefits:

1. **Improved Reliability** - A failure in one system won't affect the others
2. **Simplified Maintenance** - Each system can be updated or fixed independently
3. **Better Debugging** - Clear boundaries make it easier to diagnose issues
4. **Independent Scaling** - Systems can be scaled based on their individual usage patterns
5. **Enhanced Security** - Reduced risk of unauthorized cross-system access

## Key Files

- **API Routes**
  - `src/app/api/video-notes/route.ts` - Handles YouTube video processing
  - `src/app/api/file-notes/route.ts` - Handles file uploads and processing
  - `src/app/api/text-notes/route.ts` - Handles raw text input
  - `src/app/api/health/route.ts` - Monitors system health
  - `src/app/api/init-db/route.ts` - Initializes database tables

- **Frontend Hooks**
  - `src/hooks/useVideoNotes.ts` - Manages video notes
  - `src/hooks/useFileNotes.ts` - Manages file notes
  - `src/hooks/useTextNotes.ts` - Manages text notes

- **Service Layers**
  - `src/services/youtube.ts` - YouTube-specific functionality
  - `src/services/subtitles.ts` - Handles subtitle extraction
  - `src/services/ai.ts` - AI note generation (shared but stateless)

- **Documentation**
  - `SYSTEM-ISOLATION.md` - Detailed architectural documentation
  - `database-setup.sql` - SQL for creating isolated tables
  - `IMPLEMENTATION-SUMMARY.md` - Summary of implemented changes

## Running the Application

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up Supabase and configure environment variables
4. Run the database setup script in Supabase SQL Editor
5. Start the development server with `npm run dev`

## Demo

The homepage includes a demonstration of system isolation where you can simulate failures in individual systems while observing that the others continue to function normally.

## Future Improvements

Possible enhancements to this architecture include:

1. **Microservice Evolution** - Evolve each system into a separate microservice
2. **Custom AI Models** - Implement specialized AI models for each content type
3. **Enhanced Monitoring** - Add system-specific metrics and alerting

## License

This project is licensed under the MIT License - see the LICENSE file for details. 