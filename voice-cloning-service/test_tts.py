#!/usr/bin/env python3

import sys
import traceback

print("🧪 Testing TTS Model Loading...")
print("==============================")

try:
    print("1. Importing TTS...")
    from TTS.api import TTS
    print("✅ TTS imported successfully")
    
    print("2. Loading XTTS v2 model...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    print("✅ TTS model loaded successfully")
    
    print("3. Testing voice cloning...")
    voice_sample = "../public/assets/brainrot/voice-samples/Dr.ogur_07-02-2025 14-08-33_1.mp3"
    
    # Test generation
    tts.tts_to_file(
        text="Testowa wiadomość po polsku",
        speaker_wav=voice_sample,
        language="pl",
        file_path="test_output.wav"
    )
    print("✅ Voice generation test successful")
    
    print("\n🎉 All tests passed! TTS is working correctly.")
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Solution: pip install TTS")
    
except FileNotFoundError as e:
    print(f"❌ File Error: {e}")
    print("Check if voice sample file exists")
    
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    
    print("\n🔍 Debugging info:")
    print(f"Python version: {sys.version}")
    try:
        import torch
        print(f"PyTorch version: {torch.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
    except:
        print("PyTorch not available") 