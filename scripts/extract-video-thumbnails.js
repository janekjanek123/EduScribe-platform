const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const videoDir = path.join(__dirname, '../public/assets/brainrot/backgrounds');
const thumbnailDir = path.join(videoDir, 'thumbnails');

// Ensure thumbnails directory exists
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

const videoFiles = [
  'copy_B20C53E2-8B14-49DC-8F33-1F86EDEFAD2C.MOV',
  'copy_A625A3E7-BF73-4C23-94CB-9AC044ED8460.MOV', 
  'copy_592628F3-44A6-4877-AAF3-B8F23C22C278.MOV'
];

async function extractThumbnail(videoFile, outputName) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(videoDir, videoFile);
    const outputPath = path.join(thumbnailDir, `${outputName}.jpg`);
    
    console.log(`Extracting thumbnail from: ${videoFile}`);
    console.log(`Output: ${outputPath}`);
    
    // Exact dimensions for w-32 h-56 (128x224 pixels)
    const width = 128;
    const height = 224;
    
    console.log(`Target dimensions: ${width}x${height}`);
    
    ffmpeg(inputPath)
      .seekInput(3) // Seek to 3 seconds
      .frames(1)    // Extract 1 frame
      .videoFilters([
        // Scale and crop to exact dimensions that match the display container
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}:(in_w-${width})/2:(in_h-${height})/2`
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing ${videoFile}: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log(`✅ Thumbnail created: ${outputName}.jpg (${width}x${height})`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ Error processing ${videoFile}:`, err.message);
        reject(err);
      })
      .run();
  });
}

async function extractAllThumbnails() {
  console.log('🎬 Starting video thumbnail extraction with smaller exact dimensions...\n');
  
  for (let i = 0; i < videoFiles.length; i++) {
    const videoFile = videoFiles[i];
    const outputName = `background${i + 1}`;
    
    try {
      await extractThumbnail(videoFile, outputName);
      console.log('');
    } catch (error) {
      console.error(`Failed to process ${videoFile}:`, error.message);
      console.log('');
    }
  }
  
  console.log('🎉 Thumbnail extraction complete!');
  console.log('Check public/assets/brainrot/backgrounds/thumbnails/ for the generated images.');
}

// Run the extraction
extractAllThumbnails().catch(console.error); 