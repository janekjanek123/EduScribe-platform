export interface BackgroundAsset {
  id: string
  name: string
  filename: string
  thumbnail: string
  duration: number
  aspectRatio: string
  resolution: string
  description: string
  category: string
}

export interface AvatarAsset {
  id: string
  name: string
  filename: string
  thumbnail: string
  videoAsset?: string
  animations: Record<string, string>
  position: {
    x: string
    y: string
    scale: number
  }
  hasTransparency: boolean
  description: string
}

export class BrainrotAssetManager {
  private static backgroundCache: BackgroundAsset[] | null = null
  private static avatarCache: AvatarAsset[] | null = null

  static async getBackgroundAssets(): Promise<BackgroundAsset[]> {
    if (this.backgroundCache) {
      return this.backgroundCache
    }

    try {
      const response = await fetch('/assets/brainrot/manifests/backgrounds.json')
      if (response.ok) {
        const data = await response.json()
        this.backgroundCache = data.backgrounds
        return this.backgroundCache!
      }
    } catch (error) {
      console.warn('Failed to load background assets from manifest:', error)
    }

    // Fallback to hardcoded assets
    this.backgroundCache = [
      {
        id: 'minecraft',
        name: 'Minecraft Parkour',
        filename: 'minecraft-parkour.mp4',
        thumbnail: '/api/placeholder/minecraft-bg.jpg',
        duration: 60,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        description: 'Epic Minecraft parkour gameplay',
        category: 'gaming'
      },
      {
        id: 'subway',
        name: 'Subway Surfers',
        filename: 'subway-surfers.mp4',
        thumbnail: '/api/placeholder/subway-bg.jpg',
        duration: 45,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        description: 'Fast-paced subway surfing action',
        category: 'gaming'
      },
      {
        id: 'satisfying',
        name: 'Satisfying Visuals',
        filename: 'satisfying-visuals.mp4',
        thumbnail: '/api/placeholder/satisfying-bg.jpg',
        duration: 50,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        description: 'Relaxing satisfying content',
        category: 'satisfying'
      }
    ]

    return this.backgroundCache
  }

  static async getAvatarAssets(): Promise<AvatarAsset[]> {
    if (this.avatarCache) {
      return this.avatarCache
    }

    try {
      const response = await fetch('/assets/brainrot/manifests/avatars.json')
      if (response.ok) {
        const data = await response.json()
        this.avatarCache = data.avatars
        return this.avatarCache!
      }
    } catch (error) {
      console.warn('Failed to load avatar assets from manifest:', error)
    }

    // Fallback to hardcoded assets
    this.avatarCache = [
      {
        id: 'default',
        name: 'Default Avatar',
        filename: 'default-avatar.mp4',
        thumbnail: '/api/placeholder/avatar-default.jpg',
        animations: {
          idle: 'default-avatar.mp4',
          talking: 'default-avatar-talking.mp4',
          excited: 'default-avatar-excited.mp4'
        },
        position: {
          x: 'center',
          y: 'bottom-third',
          scale: 0.8
        },
        hasTransparency: true,
        description: 'Animated character with transparent background'
      }
    ]

    return this.avatarCache
  }

  static getBackgroundAssetPath(filename: string): string {
    return `/assets/brainrot/backgrounds/${filename}`
  }

  static getAvatarAssetPath(filename: string): string {
    return `/assets/brainrot/avatars/${filename}`
  }

  static getBackgroundThumbnailPath(thumbnail: string): string {
    if (thumbnail.startsWith('/api/placeholder/')) {
      return thumbnail
    }
    return `/assets/brainrot/backgrounds/${thumbnail}`
  }

  static getAvatarThumbnailPath(thumbnail: string): string {
    return `/assets/brainrot/avatars/${thumbnail}`
  }

  static getAvatarVideoAssetPath(avatar: AvatarAsset): string {
    const videoAsset = avatar.videoAsset || avatar.filename
    return `/assets/brainrot/avatars/${videoAsset}`
  }

  static getAvatarForDisplay(avatar: AvatarAsset): string {
    return this.getAvatarThumbnailPath(avatar.thumbnail)
  }

  static getAvatarForVideo(avatar: AvatarAsset): string {
    return this.getAvatarVideoAssetPath(avatar)
  }

  static async getBackgroundById(id: string): Promise<BackgroundAsset | undefined> {
    const backgrounds = await this.getBackgroundAssets()
    return backgrounds.find(bg => bg.id === id)
  }

  static async getAvatarById(id: string): Promise<AvatarAsset | undefined> {
    const avatars = await this.getAvatarAssets()
    return avatars.find(avatar => avatar.id === id)
  }

  static clearCache(): void {
    this.backgroundCache = null
    this.avatarCache = null
  }

  // Utility function to validate if assets exist
  static async validateAssets(): Promise<{ backgrounds: boolean; avatars: boolean }> {
    let backgroundsValid = false
    let avatarsValid = false

    try {
      const backgroundsResponse = await fetch('/assets/brainrot/manifests/backgrounds.json')
      backgroundsValid = backgroundsResponse.ok
    } catch (error) {
      backgroundsValid = false
    }

    try {
      const avatarsResponse = await fetch('/assets/brainrot/manifests/avatars.json')
      avatarsValid = avatarsResponse.ok
    } catch (error) {
      avatarsValid = false
    }

    return { backgrounds: backgroundsValid, avatars: avatarsValid }
  }
} 