# 🔥 BrainRod Video Assets Setup Guide

## 📋 Quick Setup Checklist

- [ ] Drop video backgrounds in `public/assets/brainrot/backgrounds/`
- [ ] Drop avatar animation in `public/assets/brainrot/avatars/`
- [ ] Update manifest files with your asset details
- [ ] Test the integration
- [ ] (Optional) Add thumbnails for better UX

---

## 📁 **1. File Locations** 

### **Video Backgrounds**
Drop your 9:16 TikTok-style backgrounds here:
```
public/assets/brainrot/backgrounds/
├── minecraft-parkour.mp4          # Your first background
├── subway-surfers.mp4             # Your second background  
├── satisfying-visuals.mp4         # Your third background
├── [your-new-background-1].mp4    # Add more here
├── [your-new-background-2].mp4    # Add more here
└── thumbnails/                    # Optional thumbnails
    ├── minecraft-parkour.jpg
    ├── subway-surfers.jpg
    └── satisfying-visuals.jpg
```

### **Avatar Animation**
Drop your avatar animation here:
```
public/assets/brainrot/avatars/
├── default-avatar.mp4             # Your main avatar
├── default-avatar-talking.mp4     # Talking animation (optional)
├── default-avatar-excited.mp4     # Excited animation (optional)
└── thumbnails/                    # Optional thumbnails
    └── default-avatar.jpg
```

---

## 🎥 **2. File Specifications**

### **Video Backgrounds**
- **Format**: MP4 (H.264 codec)
- **Dimensions**: 1080x1920 (9:16 aspect ratio)  
- **Frame Rate**: 30fps
- **Duration**: 30-60 seconds (will loop)
- **File Size**: 2-5MB (optimized for web)
- **Audio**: Optional (will be replaced with AI voiceover)

### **Avatar Animation**
- **Format**: MP4 with transparent background OR WebM with alpha
- **Dimensions**: 540x960 (half resolution for overlay)
- **Frame Rate**: 30fps  
- **Duration**: 5-10 seconds (will loop)
- **File Size**: 1-3MB
- **Transparency**: Must have transparent background

---

## 📝 **3. Update Manifest Files**

After adding your assets, update the JSON manifest files:

### **Backgrounds Manifest** 
Edit `public/assets/brainrot/manifests/backgrounds.json`:

```json
{
  "backgrounds": [
    {
      "id": "your-background-id",
      "name": "Your Background Name", 
      "filename": "your-background-file.mp4",
      "thumbnail": "thumbnails/your-background.jpg",
      "duration": 45,
      "aspectRatio": "9:16",
      "resolution": "1080x1920", 
      "description": "Description of your background",
      "category": "gaming" // or "satisfying", "nature", etc.
    }
    // Add more backgrounds here...
  ]
}
```

### **Avatars Manifest**
Edit `public/assets/brainrot/manifests/avatars.json`:

```json
{
  "avatars": [
    {
      "id": "your-avatar-id",
      "name": "Your Avatar Name",
      "filename": "your-avatar.mp4", 
      "thumbnail": "thumbnails/your-avatar.jpg",
      "animations": {
        "idle": "your-avatar.mp4",
        "talking": "your-avatar-talking.mp4",
        "excited": "your-avatar-excited.mp4"
      },
      "position": {
        "x": "center",      // "left", "center", "right"
        "y": "bottom-third", // "top", "center", "bottom-third"
        "scale": 0.8        // 0.5 to 1.0
      },
      "hasTransparency": true,
      "description": "Your avatar description"
    }
  ]
}
```

---

## 🔧 **4. Naming Conventions**

### **Recommended File Names:**
- Use lowercase with hyphens: `minecraft-parkour.mp4`
- Be descriptive: `satisfying-slime-asmr.mp4`
- Include category: `gaming-subway-surfers.mp4`

### **ID Conventions:**
- Use simple lowercase IDs: `minecraft`, `subway`, `satisfying`
- Match your video theme: `slime_asmr`, `parkour_epic`

---

## 🚀 **5. Testing Your Setup**

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the BrainRot page:**
   ```
   http://localhost:3003/brainrot-studying
   ```

3. **Check if your assets load:**
   - Background thumbnails should appear in the selection grid
   - Avatar thumbnail should show in the avatar section
   - No console errors related to missing assets

4. **Test asset validation:**
   Open browser console and run:
   ```javascript
   fetch('/assets/brainrot/manifests/backgrounds.json')
     .then(r => r.json())
     .then(console.log)
   ```

---

## 🎨 **6. Optional Enhancements**

### **Add Thumbnails** (Recommended)
Create 16:9 thumbnail images for better UX:
- Extract frame from your video at ~3 seconds
- Save as JPG, 320x180px
- Place in the same directory as your videos

### **Compression Tips**
For optimal web performance:

```bash
# Using FFmpeg to optimize videos:
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k -vf scale=1080:1920 output.mp4

# For avatar with transparency:
ffmpeg -i input.mov -c:v libvpx-vp9 -pix_fmt yuva420p -crf 30 -b:v 1M output.webm
```

---

## ✅ **7. Confirmation Steps**

Once your assets are in place, I will:

1. ✅ **Update the React components** to properly overlay your avatar on backgrounds
2. ✅ **Ensure 9:16 aspect ratio** is maintained throughout the pipeline  
3. ✅ **Test video composition** with your actual assets
4. ✅ **Implement proper positioning** of your avatar based on manifest settings
5. ✅ **Add error handling** for missing or corrupted assets

---

## 🐛 **Troubleshooting**

### **Assets not loading?**
- Check file paths are exactly as specified
- Ensure JSON syntax is valid in manifest files
- Verify files are actually in the correct directories

### **Avatar not transparent?**
- Use WebM format with alpha channel
- Or use MP4 with green screen (we can chroma key it)

### **Video quality issues?**
- Check your source video resolution
- Ensure compression settings maintain quality

---

## 📋 **What Happens Next**

After you've placed your assets and updated the manifests:

1. **Test locally** - Make sure everything loads correctly
2. **Let me know** - I'll update the video composition logic
3. **Review output** - We'll test the final 9:16 video generation
4. **Deploy** - Push the assets to production

**Ready to proceed?** Drop your files in the specified directories and update the manifest files. Then let me know and I'll update the video composition pipeline to work with your actual assets! 🚀 