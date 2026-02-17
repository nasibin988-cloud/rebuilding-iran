/**
 * IRAN 14XX - Audio Service
 *
 * Manages background music and sound effects for the game.
 */

export type MusicTrack =
  | 'menu'
  | 'gameplay_calm'
  | 'gameplay_tense'
  | 'gameplay_crisis'
  | 'victory'
  | 'defeat';

export type SoundEffect =
  | 'click'
  | 'hover'
  | 'notification'
  | 'decision_made'
  | 'event_appear'
  | 'turn_advance'
  | 'success'
  | 'failure'
  | 'warning'
  | 'faction_change'
  | 'resource_gain'
  | 'resource_loss';

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  musicEnabled: true,
  sfxEnabled: true
};

// Audio file paths - using persian-santoor.mp3 as constant background music
const BACKGROUND_MUSIC_PATH = '/audio/music/persian-santoor.mp3';

// All tracks point to the same file for constant music
const MUSIC_PATHS: Record<MusicTrack, string> = {
  menu: BACKGROUND_MUSIC_PATH,
  gameplay_calm: BACKGROUND_MUSIC_PATH,
  gameplay_tense: BACKGROUND_MUSIC_PATH,
  gameplay_crisis: BACKGROUND_MUSIC_PATH,
  victory: BACKGROUND_MUSIC_PATH,
  defeat: BACKGROUND_MUSIC_PATH
};

const SFX_PATHS: Record<SoundEffect, string> = {
  click: '/audio/sfx/click.mp3',
  hover: '/audio/sfx/hover.mp3',
  notification: '/audio/sfx/notification.mp3',
  decision_made: '/audio/sfx/decision.mp3',
  event_appear: '/audio/sfx/event.mp3',
  turn_advance: '/audio/sfx/turn.mp3',
  success: '/audio/sfx/success.mp3',
  failure: '/audio/sfx/failure.mp3',
  warning: '/audio/sfx/warning.mp3',
  faction_change: '/audio/sfx/faction.mp3',
  resource_gain: '/audio/sfx/gain.mp3',
  resource_loss: '/audio/sfx/loss.mp3'
};

const SETTINGS_KEY = 'iran14xx_audio_settings';

/**
 * Audio Service class
 */
export class AudioService {
  private settings: AudioSettings;
  private musicElement: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private sfxCache: Map<SoundEffect, HTMLAudioElement> = new Map();
  private isInitialized = false;

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Create music element
    this.musicElement = new Audio();
    this.musicElement.loop = true;
    this.updateMusicVolume();

    // Preload common sound effects
    this.preloadSfx(['click', 'notification', 'decision_made']);

    this.isInitialized = true;
  }

  /**
   * Preload sound effects
   */
  private preloadSfx(effects: SoundEffect[]): void {
    effects.forEach(effect => {
      const audio = new Audio();
      audio.src = SFX_PATHS[effect];
      audio.preload = 'auto';
      this.sfxCache.set(effect, audio);
    });
  }

  /**
   * Play background music (constant - same track always plays)
   */
  playMusic(track: MusicTrack): void {
    if (!this.musicElement || !this.settings.musicEnabled) return;

    // Don't restart if music is already playing (we use constant background music)
    if (this.currentTrack !== null && !this.musicElement.paused) {
      return;
    }

    // Start music if not already playing
    if (!this.currentTrack) {
      this.musicElement.src = BACKGROUND_MUSIC_PATH;
      this.currentTrack = track;

      this.musicElement.play().catch(() => {
        // Autoplay blocked by browser policy - user interaction will retry
      });

      // Fade in
      this.fadeIn();
    }
  }

  /**
   * Stop music
   */
  stopMusic(): void {
    if (!this.musicElement) return;

    this.fadeOut(() => {
      if (this.musicElement) {
        this.musicElement.pause();
        this.musicElement.currentTime = 0;
        this.currentTrack = null;
      }
    });
  }

  /**
   * Pause music
   */
  pauseMusic(): void {
    this.musicElement?.pause();
  }

  /**
   * Resume music
   */
  resumeMusic(): void {
    if (this.musicElement && this.currentTrack && this.settings.musicEnabled) {
      this.musicElement.play().catch(() => {});
    }
  }

  /**
   * Play sound effect (gracefully handles missing files)
   */
  playSfx(effect: SoundEffect): void {
    if (!this.settings.sfxEnabled || typeof window === 'undefined') return;

    // Sound effects are optional - gracefully skip if files don't exist
    const path = SFX_PATHS[effect];
    if (!path) return;

    // Get cached or create new
    let audio = this.sfxCache.get(effect);

    if (!audio) {
      audio = new Audio(path);
      audio.onerror = () => {
        // File doesn't exist - remove from cache and skip silently
        this.sfxCache.delete(effect);
      };
      this.sfxCache.set(effect, audio);
    }

    // Clone for overlapping sounds
    const clone = audio.cloneNode(true) as HTMLAudioElement;
    clone.volume = this.getEffectiveVolume('sfx');

    clone.play().catch(() => {
      // Sound playback may be blocked or file missing - ignore silently
    });

    // Clean up clone after playing
    clone.onended = () => clone.remove();
  }

  /**
   * Update music based on game state (constant background music - just ensures music is playing)
   */
  updateMusicForGameState(_regimeStability: number, _isInCrisis: boolean): void {
    // Using constant background music - just ensure it's playing
    this.playMusic('gameplay_calm');
  }

  /**
   * Start background music (call this after user interaction)
   */
  startBackgroundMusic(): void {
    this.playMusic('gameplay_calm');
  }

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.updateSettings({ masterVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(volume: number): void {
    this.updateSettings({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Toggle music
   */
  toggleMusic(): void {
    this.updateSettings({ musicEnabled: !this.settings.musicEnabled });
    if (!this.settings.musicEnabled) {
      this.pauseMusic();
    } else {
      this.resumeMusic();
    }
  }

  /**
   * Toggle SFX
   */
  toggleSfx(): void {
    this.updateSettings({ sfxEnabled: !this.settings.sfxEnabled });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getEffectiveVolume(type: 'music' | 'sfx'): number {
    const base = type === 'music' ? this.settings.musicVolume : this.settings.sfxVolume;
    return base * this.settings.masterVolume;
  }

  private updateMusicVolume(): void {
    if (this.musicElement) {
      this.musicElement.volume = this.getEffectiveVolume('music');
    }
  }

  private applySettings(): void {
    this.updateMusicVolume();
  }

  private fadeOut(callback: () => void, duration = 500): void {
    if (!this.musicElement) {
      callback();
      return;
    }

    const startVolume = this.musicElement.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      if (this.musicElement) {
        this.musicElement.volume = Math.max(0, startVolume - (volumeStep * currentStep));
      }

      if (currentStep >= steps) {
        clearInterval(fade);
        callback();
      }
    }, stepDuration);
  }

  private fadeIn(duration = 500): void {
    if (!this.musicElement) return;

    const targetVolume = this.getEffectiveVolume('music');
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    this.musicElement.volume = 0;

    const fade = setInterval(() => {
      currentStep++;
      if (this.musicElement) {
        this.musicElement.volume = Math.min(targetVolume, volumeStep * currentStep);
      }

      if (currentStep >= steps) {
        clearInterval(fade);
      }
    }, stepDuration);
  }

  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }

    return DEFAULT_SETTINGS;
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
  }
}

// Singleton instance
let audioServiceInstance: AudioService | null = null;

export function getAudioService(): AudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioService();
  }
  return audioServiceInstance;
}

export default AudioService;
