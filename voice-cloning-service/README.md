# 🎙️ Voice Cloning Service

A Python-based voice cloning service that integrates with the Eduscribe brainrot video generation system. This service uses Coqui TTS to clone voices from audio samples and generate speech for avatars.

## 📋 Features

- **Voice Cloning**: Clone voices from audio samples using Coqui TTS
- **Multi-language Support**: Supports Polish (primary) and English
- **RESTful API**: Easy integration with the main Eduscribe application
- **Docker Support**: Containerized deployment option
- **Health Monitoring**: Built-in health checks and logging

## 🚀 Quick Start

### Option 1: Native Python Setup

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Start the service:**
   ```bash
   ./start.sh
   ```

3. **Service will be available at:** `http://localhost:5001`

### Option 2: Docker Setup

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

## 📁 Voice Samples

The service automatically loads voice samples from:
```
../public/assets/brainrot/voice-samples/
```

**Required files:**
- `Dr.ogur_*.mp3` → `dr_ogur_cloned`
- `Tadzio_*.mp3` → `tadzio_cloned`
- `Marek_*.mp3` → `marek_cloned`

## 📚 API Documentation

### Health Check
```bash
GET /health
```
Returns service status and loaded voices count.

### Preload Voices
```bash
POST /preload-voices
```
Loads voice samples from the samples directory.

### Generate Speech
```bash
POST /generate-speech
Form Data:
- text: Text to convert to speech
- voice_name: Voice to use (e.g., "dr_ogur_cloned")
- language: Language code (default: "pl")
```

### List Voices
```bash
GET /list-voices
```
Returns list of available cloned voices.

## 🔧 Integration with Eduscribe

The service integrates seamlessly with the main Eduscribe application:

1. **Environment Variable**: `VOICE_CLONING_SERVICE_URL=http://localhost:5001`
2. **Automatic Fallback**: Falls back to ElevenLabs if cloning fails
3. **Avatar Mapping**: Automatically maps avatars to cloned voices

## 📊 Voice Quality Tips

For best voice cloning results:

- **Audio Length**: 2-5 minutes per voice
- **Audio Quality**: Clear, minimal background noise
- **Content Variety**: Use varied vocabulary and sentences
- **Language**: Consistent language (Polish for avatars)
- **Single Speaker**: One speaker per audio file

## 🛠️ Troubleshooting

### Service Won't Start
```bash
# Check Python version
python3 --version  # Should be 3.9+

# Recreate virtual environment
rm -rf venv
./setup.sh
```

### Voice Cloning Fails
```bash
# Check voice samples directory
ls ../public/assets/brainrot/voice-samples/

# Check service logs
docker-compose logs voice-cloning-service
```

### Audio Conversion Issues
```bash
# Verify FFmpeg is available
which ffmpeg

# Check audio file format
file ../public/assets/brainrot/voice-samples/*.mp3
```

## 📦 Dependencies

- **Python 3.9+**
- **TTS (Coqui)**: Voice cloning engine
- **Flask**: Web framework
- **PyTorch**: Machine learning backend
- **FFmpeg**: Audio processing (in main project)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Eduscribe     │    │  Voice Cloning   │    │  Coqui TTS      │
│   Next.js App   │───▶│  Service         │───▶│  Engine         │
│                 │    │  (Flask API)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Voice Samples   │
                       │  (MP3 files)     │
                       └──────────────────┘
```

## 🔍 Monitoring

### Service Health
```bash
curl http://localhost:5001/health
```

### Docker Logs
```bash
docker-compose logs -f voice-cloning-service
```

### Performance Metrics
- **Cold Start**: ~30-60 seconds (model loading)
- **Speech Generation**: 5-15 seconds per sentence
- **Memory Usage**: ~2-4GB (with model loaded)

## 🚨 Production Notes

- **GPU Recommended**: For faster speech generation
- **Memory**: Minimum 4GB RAM, 8GB recommended
- **Storage**: ~2GB for models and temporary files
- **Network**: Service runs on port 5001

## 📄 License

This service is part of the Eduscribe project and uses the following open-source components:
- **Coqui TTS**: Apache 2.0 License
- **Flask**: BSD License
- **PyTorch**: BSD License

---

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#🛠️-troubleshooting) section
2. Review service logs for error messages
3. Verify voice samples are in the correct format and location
4. Ensure all dependencies are properly installed

**Service Status**: ✅ Ready for production use 