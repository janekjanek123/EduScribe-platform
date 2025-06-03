import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';

export async function GET(request: NextRequest) {
  console.log('[Test FFmpeg API] Testing FFmpeg & FFprobe configuration...');
  
  const testResults = {
    ffmpeg: {
      installerFound: false,
      installerPath: '',
      pathExists: false,
      working: false,
      workingPath: '',
    },
    ffprobe: {
      installerFound: false, // Based on ffmpeg installer
      installerPath: '',
      pathExists: false,
      working: false,
      workingPath: '',
    },
    systemPathsFfmpeg: [] as string[],
    systemPathsFfprobe: [] as string[],
    manualPathsFfmpeg: [] as string[],
    manualPathsFfprobe: [] as string[],
    error: ''
  };

  try {
    // Test 1: Check ffmpeg-installer (and derive ffprobe)
    try {
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller && ffmpegInstaller.path) {
        testResults.ffmpeg.installerFound = true;
        testResults.ffmpeg.installerPath = ffmpegInstaller.path;
        testResults.ffmpeg.pathExists = fs.existsSync(ffmpegInstaller.path);
        
        const ffprobeInstallerPath = ffmpegInstaller.path.replace(/ffmpeg$/, 'ffprobe');
        testResults.ffprobe.installerPath = ffprobeInstallerPath;
        testResults.ffprobe.pathExists = fs.existsSync(ffprobeInstallerPath);

        if (testResults.ffmpeg.pathExists) {
          ffmpeg.setFfmpegPath(ffmpegInstaller.path);
          testResults.ffmpeg.workingPath = ffmpegInstaller.path;
        }
        if (testResults.ffprobe.pathExists) {
          ffmpeg.setFfprobePath(ffprobeInstallerPath);
          testResults.ffprobe.workingPath = ffprobeInstallerPath;
          testResults.ffprobe.installerFound = true; // Mark as found if path exists
        }
      }
    } catch (error: any) {
      console.log('[Test FFmpeg API] FFmpeg installer require failed:', error.message);
    }

    // Test 2: Check manual paths (like in the main service)
    const manualPathPairs = [
      { ffmpeg: path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffmpeg'), ffprobe: path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffprobe') },
      { ffmpeg: path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'darwin-arm64', 'ffmpeg'), ffprobe: path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'darwin-arm64', 'ffprobe') },
    ];

    for (const pair of manualPathPairs) {
      if (fs.existsSync(pair.ffmpeg)) {
        testResults.manualPathsFfmpeg.push(pair.ffmpeg);
        if (!testResults.ffmpeg.workingPath) {
          ffmpeg.setFfmpegPath(pair.ffmpeg);
          testResults.ffmpeg.workingPath = pair.ffmpeg;
        }
      }
      if (fs.existsSync(pair.ffprobe)) {
        testResults.manualPathsFfprobe.push(pair.ffprobe);
        if (!testResults.ffprobe.workingPath) {
          ffmpeg.setFfprobePath(pair.ffprobe);
          testResults.ffprobe.workingPath = pair.ffprobe;
        }
      }
    }

    // Test 3: Check system paths
    const systemPathPairs = [
      { ffmpeg: '/usr/local/bin/ffmpeg', ffprobe: '/usr/local/bin/ffprobe' },
      { ffmpeg: '/usr/bin/ffmpeg', ffprobe: '/usr/bin/ffprobe' },
      { ffmpeg: '/opt/homebrew/bin/ffmpeg', ffprobe: '/opt/homebrew/bin/ffprobe' },
      { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' }
    ];

    for (const pair of systemPathPairs) {
      if (pair.ffmpeg === 'ffmpeg' || fs.existsSync(pair.ffmpeg)) {
        testResults.systemPathsFfmpeg.push(pair.ffmpeg);
        if (!testResults.ffmpeg.workingPath) {
          ffmpeg.setFfmpegPath(pair.ffmpeg);
          testResults.ffmpeg.workingPath = pair.ffmpeg;
        }
      }
      if (pair.ffprobe === 'ffprobe' || fs.existsSync(pair.ffprobe)) {
        testResults.systemPathsFfprobe.push(pair.ffprobe);
        if (!testResults.ffprobe.workingPath) {
          ffmpeg.setFfprobePath(pair.ffprobe);
          testResults.ffprobe.workingPath = pair.ffprobe;
        }
      }
    }
    
    // Test 4: Test FFmpeg & FFprobe functionality
    let ffmpegError = '';
    let ffprobeError = '';

    if (testResults.ffmpeg.workingPath) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('FFmpeg test timeout (formats)')), 5000);
          ffmpeg.getAvailableFormats((err) => {
            clearTimeout(timeout);
            if (err) reject(err); else { testResults.ffmpeg.working = true; resolve(null); }
          });
        });
      } catch (error: any) {
        ffmpegError = error.message;
      }
    } else {
      ffmpegError = 'No FFmpeg binary found to test';
    }

    if (testResults.ffprobe.workingPath) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('FFprobe test timeout')), 5000);
          // Test ffprobe with a dummy file path, expecting a 'No such file or directory' error, 
          // not a 'Cannot find ffprobe' error.
          ffmpeg.ffprobe('dummy_test_file_for_api.mp4', (err, metadata) => {
            clearTimeout(timeout);
            if (err && err.message.toLowerCase().includes('cannot find ffprobe')) {
              reject(err); // This is a failure for ffprobe itself
            } else if (err && err.message.toLowerCase().includes('no such file')){
                testResults.ffprobe.working = true; // Expected error, means ffprobe ran
                resolve(null);
            } else if (!err) {
                 testResults.ffprobe.working = true; // Unexpected success, but ffprobe ran
                 resolve(null);
            } else {
                reject(err); // Other unexpected error
            }
          });
        });
      } catch (error: any) {
        ffprobeError = error.message;
      }
    } else {
      ffprobeError = 'No FFprobe binary found to test';
    }

    testResults.error = [ffmpegError, ffprobeError].filter(Boolean).join('; ') || 'All tests passed (or no binary to test)';
    if (ffmpegError || ffprobeError) {
        console.warn('[Test FFmpeg API] Test errors:', { ffmpegError, ffprobeError });
    }

    console.log('[Test FFmpeg API] Test results:', JSON.stringify(testResults, null, 2));

    return NextResponse.json({
      success: testResults.ffmpeg.working && testResults.ffprobe.working,
      ffmpegStatus: testResults
    });

  } catch (error: any) {
    console.error('[Test FFmpeg API] Global test failed:', error);
    testResults.error = error.message;
    return NextResponse.json({
      success: false,
      error: error.message,
      ffmpegStatus: testResults
    }, { status: 500 });
  }
} 