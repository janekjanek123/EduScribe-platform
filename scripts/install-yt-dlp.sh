#!/bin/bash

# Script to install yt-dlp for YouTube subtitle extraction
# Usage: bash scripts/install-yt-dlp.sh

echo "Installing yt-dlp for YouTube subtitle extraction..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &>/dev/null; then
        echo "Installing yt-dlp using Homebrew..."
        brew install yt-dlp
    else
        echo "Homebrew not found. Installing yt-dlp using pip..."
        python3 -m pip install --upgrade yt-dlp
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &>/dev/null; then
        echo "Installing yt-dlp using apt..."
        sudo apt-get update
        sudo apt-get install -y python3-pip
        python3 -m pip install --upgrade yt-dlp
    elif command -v yum &>/dev/null; then
        echo "Installing yt-dlp using yum..."
        sudo yum install -y python3-pip
        python3 -m pip install --upgrade yt-dlp
    else
        echo "Installing yt-dlp using pip..."
        python3 -m pip install --upgrade yt-dlp
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash or similar)
    echo "Installing yt-dlp using pip..."
    python -m pip install --upgrade yt-dlp
else
    echo "Unsupported OS. Please install yt-dlp manually:"
    echo "- macOS: brew install yt-dlp"
    echo "- Linux/macOS: pip install yt-dlp"
    echo "- Windows: pip install yt-dlp or choco install yt-dlp"
    exit 1
fi

# Verify installation
if command -v yt-dlp &>/dev/null; then
    echo "✅ yt-dlp installed successfully!"
    echo "Version: $(yt-dlp --version)"
else
    echo "❌ Failed to install yt-dlp. Please install it manually:"
    echo "- macOS: brew install yt-dlp"
    echo "- Linux/macOS: pip install yt-dlp"
    echo "- Windows: pip install yt-dlp or choco install yt-dlp"
    exit 1
fi

echo ""
echo "You can now use the subtitle extraction feature."
echo "Try it with: node scripts/test-subtitles.js https://www.youtube.com/watch?v=VIDEOID" 