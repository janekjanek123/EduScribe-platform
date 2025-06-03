#!/usr/bin/env node

/**
 * Test script for YouTube subtitle extraction
 * 
 * Usage: node scripts/test-subtitles.js <youtube-url>
 * 
 * This script tests subtitle extraction using yt-dlp and reports
 * the results.
 */

const { execaCommand } = require('execa');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { randomUUID } = require('crypto');
const subtitle = require('subtitle');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

// Get URL from command line arguments
const youtubeUrl = process.argv[2];
if (!youtubeUrl) {
  console.error('Please provide a YouTube URL as an argument');
  console.error('Usage: node scripts/test-subtitles.js <youtube-url>');
  process.exit(1);
}

// Extract video ID from URL
function extractYouTubeId(url) {
  // Simple regex to extract ID from common YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

async function testSubtitleExtraction() {
  console.log(`Testing subtitle extraction for: ${youtubeUrl}`);
  
  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    console.error('Could not extract a valid YouTube video ID from the URL');
    process.exit(1);
  }
  
  console.log(`Extracted video ID: ${videoId}`);
  
  // Check if yt-dlp is installed
  try {
    const { stdout } = await execaCommand('yt-dlp --version', { shell: true });
    console.log(`yt-dlp version: ${stdout.trim()}`);
  } catch (error) {
    console.error('yt-dlp is not installed or not in PATH');
    console.error('Please install yt-dlp:');
    console.error('  • macOS: brew install yt-dlp');
    console.error('  • Linux/macOS: pip install yt-dlp');
    console.error('  • Windows: pip install yt-dlp or choco install yt-dlp');
    process.exit(1);
  }
  
  // Create a temporary directory for downloads
  const tempDir = path.join(process.cwd(), 'temp');
  if (!await exists(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  
  // Generate a unique output filename
  const uniqueId = randomUUID();
  const outputTemplate = path.join(tempDir, `${uniqueId}-%(id)s.%(ext)s`);
  
  // Try to download subtitles
  console.log('Attempting to download subtitles...');
  const languages = ['pl', 'en'];
  const langPref = languages.join(',');
  
  // First try regular subtitles
  try {
    const { stdout, stderr } = await execaCommand(
      `yt-dlp --verbose --write-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" ${youtubeUrl}`,
      { shell: true, timeout: 30000 }
    );
    
    console.log('yt-dlp regular subtitles output:');
    console.log(stdout);
    
    if (stderr) {
      console.warn('yt-dlp stderr:');
      console.warn(stderr);
    }
  } catch (error) {
    console.error('Error downloading regular subtitles:', error.message);
  }
  
  // Then try auto-generated subtitles
  try {
    const { stdout, stderr } = await execaCommand(
      `yt-dlp --verbose --write-auto-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" ${youtubeUrl}`,
      { shell: true, timeout: 30000 }
    );
    
    console.log('yt-dlp auto-generated subtitles output:');
    console.log(stdout);
    
    if (stderr) {
      console.warn('yt-dlp stderr:');
      console.warn(stderr);
    }
  } catch (error) {
    console.error('Error downloading auto-generated subtitles:', error.message);
  }
  
  // List files that were created
  try {
    const { stdout } = await execaCommand(`ls -la ${tempDir}/${uniqueId}-*`, { shell: true });
    console.log('Files created:');
    console.log(stdout);
    
    // Find subtitle files
    const files = stdout.split('\n')
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1]; // Get the last part which is the filename
      })
      .filter(file => file && (file.endsWith('.vtt') || file.endsWith('.srt')));
    
    if (files.length === 0) {
      console.log('No subtitle files were created.');
      return;
    }
    
    // Process the first subtitle file found
    const subtitleFile = files[0];
    console.log(`Processing subtitle file: ${subtitleFile}`);
    
    const content = await readFile(subtitleFile, 'utf8');
    const extension = path.extname(subtitleFile).toLowerCase();
    
    let text = '';
    
    if (extension === '.vtt' || extension === '.srt') {
      const captions = subtitle.parseSync(content);
      text = captions
        .map(item => item.text || '')
        .filter(Boolean)
        .join(' ');
        
      // Clean up the text
      text = text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
        .trim();
        
      console.log('\nExtracted text (first 500 chars):');
      console.log(text.substring(0, 500) + '...');
      console.log(`\nTotal text length: ${text.length} characters`);
    } else {
      console.error(`Unsupported subtitle format: ${extension}`);
    }
    
    // Clean up
    for (const file of files) {
      try {
        await unlink(file);
        console.log(`Deleted temporary file: ${file}`);
      } catch (cleanupError) {
        console.warn(`Error deleting temporary file ${file}:`, cleanupError.message);
      }
    }
  } catch (error) {
    console.error('Error listing or processing subtitle files:', error.message);
  }
}

// Run the test
testSubtitleExtraction()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 