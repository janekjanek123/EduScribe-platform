from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
import logging
import subprocess
import sys
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js communication

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store cloned voice models (in production, use persistent storage)
VOICE_MODELS = {}

# Initialize TTS model (will be loaded when first needed)
tts_model = None

def install_tts():
    """Install TTS if not available"""
    try:
        import TTS
        logger.info("TTS already installed")
        return True
    except ImportError:
        logger.info("Installing TTS...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "TTS", "torch", "torchaudio"])
            logger.info("TTS installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install TTS: {e}")
            return False

def load_tts_model():
    """Load TTS model for voice cloning"""
    global tts_model
    if tts_model is None:
        try:
            from TTS.api import TTS
            logger.info("Loading TTS model for voice cloning...")
            # Use XTTS v2 which is excellent for voice cloning
            tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False)
            logger.info("TTS model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load TTS model: {e}")
            # For now, disable TTS and let system fall back to ElevenLabs
            logger.info("Disabling voice cloning - system will use ElevenLabs fallback")
            return False
    return True

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'voice-cloning-service',
        'tts_loaded': tts_model is not None,
        'voices_loaded': len(VOICE_MODELS)
    })

@app.route('/clone-voice', methods=['POST'])
def clone_voice():
    """Clone a voice from uploaded audio sample"""
    try:
        # Check if TTS model is loaded
        if not load_tts_model():
            return jsonify({'error': 'TTS model failed to load'}), 500
            
        # Get audio file and voice name
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio_file = request.files['audio']
        voice_name = request.form.get('voice_name')
        
        if not voice_name:
            return jsonify({'error': 'No voice name provided'}), 400
        
        logger.info(f"Cloning voice: {voice_name}")
        
        # Save uploaded audio temporarily
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        audio_file.save(temp_audio.name)
        
        # Store the voice sample path for this voice
        VOICE_MODELS[voice_name] = temp_audio.name
        
        logger.info(f"Voice {voice_name} cloned successfully")
        
        return jsonify({
            'success': True, 
            'voice_name': voice_name,
            'message': f'Voice {voice_name} cloned and ready for use'
        })
        
    except Exception as e:
        logger.error(f"Voice cloning error: {e}")
        return jsonify({'error': f'Voice cloning failed: {str(e)}'}), 500

@app.route('/generate-speech', methods=['POST'])
def generate_speech():
    """Generate speech using cloned voice"""
    try:
        # Check if TTS model is loaded
        if not load_tts_model():
            return jsonify({'error': 'TTS model failed to load'}), 500
            
        text = request.form.get('text')
        voice_name = request.form.get('voice_name')
        language = request.form.get('language', 'pl')  # Default to Polish
        
        if not text or not voice_name:
            return jsonify({'error': 'Text and voice_name are required'}), 400
        
        if voice_name not in VOICE_MODELS:
            return jsonify({'error': f'Voice {voice_name} not found. Available: {list(VOICE_MODELS.keys())}'}), 400
        
        logger.info(f"Generating speech for voice: {voice_name}, text length: {len(text)}")
        
        # Create output file
        output_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        
        # Generate speech with cloned voice
        tts_model.tts_to_file(
            text=text,
            speaker_wav=VOICE_MODELS[voice_name],
            language=language,
            file_path=output_file.name,
            split_sentences=True  # Better for longer text
        )
        
        logger.info(f"Speech generated successfully for {voice_name}")
        
        return send_file(
            output_file.name, 
            as_attachment=True, 
            download_name=f'{voice_name}_speech.wav',
            mimetype='audio/wav'
        )
        
    except Exception as e:
        logger.error(f"Speech generation error: {e}")
        return jsonify({'error': f'Speech generation failed: {str(e)}'}), 500

@app.route('/list-voices', methods=['GET'])
def list_voices():
    """List all available cloned voices"""
    return jsonify({
        'voices': list(VOICE_MODELS.keys()),
        'count': len(VOICE_MODELS)
    })

@app.route('/preload-voices', methods=['POST'])
def preload_voices():
    """Preload voices from the project's voice samples directory"""
    try:
        # Path to voice samples in the main project
        voice_samples_dir = "../public/assets/brainrot/voice-samples"
        
        if not os.path.exists(voice_samples_dir):
            return jsonify({'error': 'Voice samples directory not found'}), 400
        
        loaded_voices = []
        
        # Map filenames to voice names
        file_mappings = {
            'Dr.ogur': 'dr_ogur_cloned',
            'Tadzio': 'tadzio_cloned', 
            'Marek': 'marek_cloned'
        }
        
        for filename in os.listdir(voice_samples_dir):
            if filename.endswith('.mp3'):
                # Extract character name from filename
                for char_name, voice_id in file_mappings.items():
                    if char_name in filename:
                        file_path = os.path.join(voice_samples_dir, filename)
                        VOICE_MODELS[voice_id] = file_path
                        loaded_voices.append(voice_id)
                        logger.info(f"Preloaded voice: {voice_id} from {filename}")
                        break
        
        return jsonify({
            'success': True,
            'loaded_voices': loaded_voices,
            'total_voices': len(VOICE_MODELS)
        })
        
    except Exception as e:
        logger.error(f"Voice preloading error: {e}")
        return jsonify({'error': f'Voice preloading failed: {str(e)}'}), 500

if __name__ == '__main__':
    # Install TTS on startup
    if install_tts():
        logger.info("🎙️ Voice Cloning Service starting...")
        logger.info("📂 Checking for voice samples...")
        
        # Try to preload voices on startup
        try:
            voice_samples_dir = "../public/assets/brainrot/voice-samples"
            if os.path.exists(voice_samples_dir):
                logger.info("📋 Found voice samples directory, preloading...")
                # This will be called via API after startup
        except Exception as e:
            logger.warning(f"Could not preload voices: {e}")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        logger.error("❌ Failed to install TTS dependencies") 