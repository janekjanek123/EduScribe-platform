#!/usr/bin/env node

/**
 * Test script to verify FFmpeg installation and functionality
 * Run with: node scripts/test-ffmpeg.js
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

console.log('🔧 Testing FFmpeg Configuration...\n');

// Set FFmpeg path using the ffmpeg-installer
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log('✅ FFmpeg path set:', ffmpegInstaller.path);
  } else {
    console.log('⚠️  FFmpeg installer found but no path');
  }
} catch (error) {
  console.log('⚠️  FFmpeg installer not found, using system FFmpeg');
}

// Test 1: Check FFmpeg availability
console.log('\n📋 Test 1: FFmpeg Availability');
ffmpeg.getAvailableFormats((err, formats) => {
  if (err) {
    console.log('❌ FFmpeg not available:', err.message);
    console.log('\n💡 Try installing FFmpeg:');
    console.log('   - macOS: brew install ffmpeg');
    console.log('   - Ubuntu: sudo apt install ffmpeg');
    console.log('   - Windows: Download from https://ffmpeg.org/');
    process.exit(1);
  } else {
    console.log('✅ FFmpeg is available');
    console.log(`📊 Supported formats: ${Object.keys(formats).length}`);
    
    // Check for common video formats
    const commonFormats = ['mp4', 'mov', 'webm', 'avi'];
    console.log('\n📹 Common video format support:');
    commonFormats.forEach(format => {
      const supported = formats[format] ? '✅' : '❌';
      console.log(`  ${supported} ${format.toUpperCase()}`);
    });
  }
});

// Test 2: Check codecs
console.log('\n📋 Test 2: Codec Availability');
ffmpeg.getAvailableCodecs((err, codecs) => {
  if (err) {
    console.log('❌ Cannot get codec information:', err.message);
  } else {
    console.log('✅ Codec information available');
    
    // Check for important codecs
    const importantCodecs = ['h264', 'aac', 'mp3', 'pcm_s16le'];
    console.log('\n🎵 Important codec support:');
    importantCodecs.forEach(codec => {
      const supported = codecs[codec] ? '✅' : '❌';
      console.log(`  ${supported} ${codec}`);
    });
  }
});

// Test 3: Version information
console.log('\n📋 Test 3: Version Information');
ffmpeg().version((err, version) => {
  if (err) {
    console.log('❌ Cannot get version information:', err.message);
  } else {
    console.log('✅ FFmpeg version:', version);
  }
});

console.log('\n🏁 FFmpeg test completed. If you see errors above, please install or fix FFmpeg before using video upload.');
console.log('📚 For more help: https://ffmpeg.org/download.html'); 