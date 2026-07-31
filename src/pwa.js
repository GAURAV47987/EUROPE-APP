import { registerSW } from "virtual:pwa-register";

let updateSW = null;

if ("serviceWorker" in navigator) {
  updateSW = registerSW({ immediate: true });
}

// Forces the waiting service worker (if any) to take over, then reloads —
// picks up whatever is currently live on the server instead of whatever
// got cached on install, without needing to fully close and reopen the app.
export async function refreshApp() {
  if (updateSW) {
    try {
      await updateSW(true);
    } catch (e) {}
  }
  window.location.reload();
}
