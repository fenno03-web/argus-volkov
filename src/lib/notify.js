import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { S } from './store.svelte.js';

const native = Capacitor.isNativePlatform();

export async function buzz(strong = false) {
  try {
    if (native) {
      await Haptics.impact({ style: strong ? ImpactStyle.Heavy : ImpactStyle.Medium });
      if (strong) setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 180);
    } else if (navigator.vibrate) {
      navigator.vibrate(strong ? [120, 80, 120] : 60);
    }
  } catch { /* no haptics */ }
}

export async function speak(text) {
  if (!S.speech || !text) return;
  const lang = S.lang === 'nl' ? 'nl-NL' : 'en-GB';
  try {
    if (native) {
      await TextToSpeech.speak({ text, lang, rate: 1.05, volume: 1.0, category: 'playback' });
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  } catch { /* no tts */ }
}
