#!/bin/bash

echo "🎙️ Starting Voice Cloning Service..."
echo "===================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./setup.sh first."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if voice samples exist
if [ ! -d "../public/assets/brainrot/voice-samples" ]; then
    echo "⚠️  Voice samples directory not found at ../public/assets/brainrot/voice-samples"
    echo "   Please make sure your voice samples are in the correct location."
fi

# Start the service
echo "🚀 Starting voice cloning service on port 5001..."
echo "   Service will be available at: http://localhost:5001"
echo "   Health check: http://localhost:5001/health"
echo ""
echo "   Press Ctrl+C to stop the service"
echo ""

python app.py 