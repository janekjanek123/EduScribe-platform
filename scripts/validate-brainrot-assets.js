#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function validateBrainrotAssets() {
  log(colors.bold + colors.blue, '🔥 BrainRot Video Assets Validator\n');

  const results = {
    directories: { passed: 0, failed: 0 },
    manifests: { passed: 0, failed: 0 },
    assets: { passed: 0, failed: 0 }
  };

  // Check directory structure
  log(colors.bold, '📁 Checking Directory Structure...');
  
  const requiredDirs = [
    'public/assets/brainrot',
    'public/assets/brainrot/backgrounds',
    'public/assets/brainrot/avatars',
    'public/assets/brainrot/manifests'
  ];

  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      log(colors.green, `✅ ${dir}`);
      results.directories.passed++;
    } else {
      log(colors.red, `❌ ${dir} - Missing!`);
      results.directories.failed++;
    }
  }

  // Check manifest files
  log(colors.bold, '\n📝 Checking Manifest Files...');
  
  const manifestFiles = [
    'public/assets/brainrot/manifests/backgrounds.json',
    'public/assets/brainrot/manifests/avatars.json'
  ];

  for (const manifestFile of manifestFiles) {
    if (fs.existsSync(manifestFile)) {
      try {
        const content = fs.readFileSync(manifestFile, 'utf8');
        const parsed = JSON.parse(content);
        log(colors.green, `✅ ${manifestFile} - Valid JSON`);
        results.manifests.passed++;
        
        // Log asset count
        if (manifestFile.includes('backgrounds')) {
          log(colors.blue, `   📊 ${parsed.backgrounds?.length || 0} background(s) defined`);
        } else if (manifestFile.includes('avatars')) {
          log(colors.blue, `   📊 ${parsed.avatars?.length || 0} avatar(s) defined`);
        }
      } catch (error) {
        log(colors.red, `❌ ${manifestFile} - Invalid JSON: ${error.message}`);
        results.manifests.failed++;
      }
    } else {
      log(colors.red, `❌ ${manifestFile} - Missing!`);
      results.manifests.failed++;
    }
  }

  // Check actual asset files
  log(colors.bold, '\n🎬 Checking Asset Files...');

  // Check backgrounds
  if (fs.existsSync('public/assets/brainrot/manifests/backgrounds.json')) {
    try {
      const backgroundsManifest = JSON.parse(
        fs.readFileSync('public/assets/brainrot/manifests/backgrounds.json', 'utf8')
      );
      
      for (const bg of backgroundsManifest.backgrounds || []) {
        const videoPath = `public/assets/brainrot/backgrounds/${bg.filename}`;
        if (fs.existsSync(videoPath)) {
          const stats = fs.statSync(videoPath);
          const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
          log(colors.green, `✅ Background: ${bg.name} (${sizeInMB}MB)`);
          results.assets.passed++;
        } else {
          log(colors.red, `❌ Background: ${bg.name} - File not found: ${videoPath}`);
          results.assets.failed++;
        }
        
        // Check thumbnail
        if (bg.thumbnail && !bg.thumbnail.includes('placeholder')) {
          const thumbnailPath = `public/assets/brainrot/backgrounds/${bg.thumbnail}`;
          if (fs.existsSync(thumbnailPath)) {
            log(colors.blue, `   🖼️  Thumbnail found`);
          } else {
            log(colors.yellow, `   ⚠️  Thumbnail missing (using fallback)`);
          }
        }
      }
    } catch (error) {
      log(colors.red, `❌ Error reading backgrounds manifest: ${error.message}`);
    }
  }

  // Check avatars
  if (fs.existsSync('public/assets/brainrot/manifests/avatars.json')) {
    try {
      const avatarsManifest = JSON.parse(
        fs.readFileSync('public/assets/brainrot/manifests/avatars.json', 'utf8')
      );
      
      for (const avatar of avatarsManifest.avatars || []) {
        const videoPath = `public/assets/brainrot/avatars/${avatar.filename}`;
        if (fs.existsSync(videoPath)) {
          const stats = fs.statSync(videoPath);
          const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
          log(colors.green, `✅ Avatar: ${avatar.name} (${sizeInMB}MB)`);
          results.assets.passed++;
          
          if (avatar.hasTransparency) {
            log(colors.blue, `   🔍 Has transparency: ${avatar.hasTransparency}`);
          }
        } else {
          log(colors.red, `❌ Avatar: ${avatar.name} - File not found: ${videoPath}`);
          results.assets.failed++;
        }
      }
    } catch (error) {
      log(colors.red, `❌ Error reading avatars manifest: ${error.message}`);
    }
  }

  // Summary
  log(colors.bold, '\n📊 Validation Summary:');
  log(colors.blue, `Directories: ${colors.green}${results.directories.passed} passed${colors.blue}, ${colors.red}${results.directories.failed} failed`);
  log(colors.blue, `Manifests: ${colors.green}${results.manifests.passed} passed${colors.blue}, ${colors.red}${results.manifests.failed} failed`);
  log(colors.blue, `Assets: ${colors.green}${results.assets.passed} passed${colors.blue}, ${colors.red}${results.assets.failed} failed`);

  const totalPassed = results.directories.passed + results.manifests.passed + results.assets.passed;
  const totalFailed = results.directories.failed + results.manifests.failed + results.assets.failed;

  if (totalFailed === 0) {
    log(colors.bold + colors.green, '\n🎉 All checks passed! Your BrainRot assets are ready to use!');
  } else {
    log(colors.bold + colors.yellow, '\n⚠️  Some issues found. Please fix the failed items above.');
  }

  // Next steps
  log(colors.bold, '\n🚀 Next Steps:');
  if (totalFailed === 0) {
    log(colors.blue, '1. Start your dev server: npm run dev');
    log(colors.blue, '2. Visit: http://localhost:3003/brainrot-studying');
    log(colors.blue, '3. Test your assets in the interface');
    log(colors.blue, '4. Let the developer know assets are ready!');
  } else {
    log(colors.blue, '1. Fix the failed items listed above');
    log(colors.blue, '2. Run this validator again: node scripts/validate-brainrot-assets.js');
    log(colors.blue, '3. Repeat until all checks pass');
  }

  return totalFailed === 0;
}

// Run the validator
if (require.main === module) {
  validateBrainrotAssets().catch(error => {
    log(colors.red, `\n❌ Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { validateBrainrotAssets }; 