/**
 * Background & System Notification Manager
 * Handles Service Worker registration, OS-level head-up banner notifications
 * on Android, iOS 16.4+ (PWA), Windows, and macOS, plus vibration alerts.
 */

import { playNotificationSound, unlockAudio } from './audio';
import { SoundPreset } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for background notifications
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported in this browser environment.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[PWA] Service Worker registered with scope:', reg.scope);
    return reg;
  } catch (err: any) {
    console.warn('[PWA] Service Worker registration failed:', err.message);
    return null;
  }
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current permission state: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user with unlock of audio
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  unlockAudio();

  if (!isNotificationSupported()) {
    throw new Error('Notifikasi tidak didukung oleh browser ini.');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerNotificationServiceWorker();
    }
    return permission;
  } catch (err: any) {
    console.error('Request permission error:', err);
    return 'denied';
  }
}

export interface ScreenNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  orderId?: string;
  soundPreset?: SoundPreset;
  soundVolume?: number;
  customSoundUrl?: string;
  playSound?: boolean;
}

/**
 * Send System / Background Screen Banner Notification
 * Works on top of Android screen, PC Windows Action Center, Mac Notification Center, and iOS PWA!
 */
export async function sendScreenNotification(options: ScreenNotificationOptions) {
  const {
    title,
    body,
    tag = 'order-alert-' + Date.now(),
    orderId,
    soundPreset = 'cash_register',
    soundVolume = 85,
    customSoundUrl,
    playSound = true
  } = options;

  // 1. Play Custom Sound immediately
  if (playSound) {
    playNotificationSound(soundPreset, soundVolume, customSoundUrl);
  }

  // 2. Trigger Device Vibration (supported on Android devices)
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 450]);
    } catch {}
  }

  // 3. Show Native OS Banner Notification
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const notificationPayload = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 450],
    data: {
      url: '/',
      orderId: orderId || null
    }
  };

  try {
    // Prefer Service Worker registration to show native background notification (crucial for Android and background tabs)
    if (!swRegistration && 'serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => null);
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, notificationPayload);
      return;
    }

    // Fallback to standard Notification constructor
    const notif = new Notification(title, notificationPayload);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err: any) {
    console.warn('[Notification] Failed to show system banner:', err.message);
  }
}
