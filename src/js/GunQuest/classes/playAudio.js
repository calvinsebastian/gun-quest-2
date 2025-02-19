import { mute } from "../js/eventListeners.js";
import { effectsToggle } from "../GunQuest.js";

class SoundManager {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Load a sound from a URL
  async loadSound(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading sound:", error);
      return null;
    }
  }

  // Play a sound from a URL
  async playSound(url, volume = 0.5) {
    if (effectsToggle.checked) {
      const buffer = await this.loadSound(url);
      if (buffer) {
        const source = this.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.value = volume; // Adjust volume if needed

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);
      } else {
        console.warn(`Sound from URL '${url}' could not be loaded.`);
      }
    }
  }
}

// Initialize SoundManager
const soundManager = new SoundManager();

// Export function to play sounds dynamically
export function playSound(url, volume = 0.5) {
  if (!mute) {
    soundManager.playSound(url, volume);
  }
}
