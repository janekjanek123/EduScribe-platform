#!/usr/bin/env node

/**
 * Test script to debug video validation issues
 * Run with: node scripts/test-video-validation.js <path-to-video-file>
 */

const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');

// Set FFmpeg path
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log('✅ FFmpeg path set:', ffmpegInstaller.path);
  }
} catch (error) {
  console.warn('⚠️  FFmpeg installer not found, using system FFmpeg');
}

// Get file path from command line arguments
const videoFilePath = process.argv[2];

if (!videoFilePath) {
  console.log('❌ Please provide a video file path');
  console.log('Usage: node scripts/test-video-validation.js <path-to-video-file>');
  process.exit(1);
}

console.log('🧪 Testing Video Validation...\n');
console.log(`📁 File path: ${videoFilePath}`);

async function testVideoValidation(filePath) {
  console.log('\n📋 Step 1: Basic file checks');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ File does not exist');
    return;
  }
  console.log('✅ File exists');

  // Check file size
  const stats = fs.statSync(filePath);
  console.log(`✅ File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  if (stats.size === 0) {
    console.log('❌ File is empty');
    return;
  }

  console.log('\n📋 Step 2: FFprobe analysis');

  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        console.log('❌ FFprobe error:', error.message);
        console.log('\n🔍 Detailed error:', error);
        
        // Try fallback validation
        console.log('\n📋 Step 3: Fallback validation (file extension)');
        const supportedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const fileExtension = path.extname(filePath).toLowerCase();
        const isValidExtension = supportedExtensions.includes(fileExtension);
        console.log(`File extension: ${fileExtension}`);
        console.log(`Valid extension: ${isValidExtension ? '✅' : '❌'}`);
        
        resolve(isValidExtension);
        return;
      }

      console.log('✅ FFprobe analysis successful');
      
      console.log('\n📊 Video Information:');
      console.log(`  Format: ${metadata.format?.format_name || 'unknown'}`);
      console.log(`  Duration: ${metadata.format?.duration || 'unknown'}s`);
      console.log(`  Bitrate: ${metadata.format?.bit_rate || 'unknown'}`);
      console.log(`  Size: ${metadata.format?.size || 'unknown'} bytes`);
      
      console.log('\n📺 Streams:');
      if (!metadata.streams || metadata.streams.length === 0) {
        console.log('❌ No streams found');
        resolve(false);
        return;
      }

      let hasVideoStream = false;
      let hasAudioStream = false;

      metadata.streams.forEach((stream, index) => {
        console.log(`  Stream ${index}:`);
        console.log(`    Type: ${stream.codec_type || 'unknown'}`);
        console.log(`    Codec: ${stream.codec_name || 'unknown'}`);
        console.log(`    Duration: ${stream.duration || 'unknown'}s`);
        
        if (stream.codec_type === 'video') {
          hasVideoStream = true;
          console.log(`    Resolution: ${stream.width}x${stream.height}`);
          console.log(`    FPS: ${stream.r_frame_rate || 'unknown'}`);
        }
        
        if (stream.codec_type === 'audio') {
          hasAudioStream = true;
          console.log(`    Sample Rate: ${stream.sample_rate || 'unknown'}`);
          console.log(`    Channels: ${stream.channels || 'unknown'}`);
        }
      });

      console.log('\n📋 Step 3: Validation Results');
      console.log(`Has video stream: ${hasVideoStream ? '✅' : '❌'}`);
      console.log(`Has audio stream: ${hasAudioStream ? '✅' : '❌'}`);
      
      const isValid = hasAudioStream || hasVideoStream;
      console.log(`\n🎯 Final validation result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n💡 Possible issues:');
        console.log('  - Video file might be corrupted');
        console.log('  - File might not be a proper video format');
        console.log('  - FFmpeg might not support this specific codec');
      } else {
        console.log('\n🎉 Video file should work with the upload system!');
      }
      
      resolve(isValid);
    });
  });
}

// Run the test
testVideoValidation(videoFilePath)
  .then(result => {
    console.log(`\n🏁 Test completed. Result: ${result ? 'PASS' : 'FAIL'}`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error);
    process.exit(1);
  }); 