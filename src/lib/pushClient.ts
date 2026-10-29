const FALLBACK_PUBLIC_VAPID_KEY =
  'BJlHq_dp6__mAMAAa1MKDsQG937EdtJDXktBlYTCUgV-bfydS2OMl2ZYFiAqkpcIqrSJQeITxkiMT_LJzWYX1wM';

export function getPublicVapidKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_PUBLIC_VAPID_KEY;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData =
    typeof window !== 'undefined'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    Boolean(nav.standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function triggerLocalServiceWorkerNotification(
  title: string,
  body: string,
  url = '/'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: { url },
      });
      return true;
    }
  } catch {
    // Fallback to Notification constructor
  }
  try {
    new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    return true;
  } catch {
    return false;
  }
}
