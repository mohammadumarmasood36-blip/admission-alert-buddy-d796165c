import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — the native mobile app loads ONLY the school portal
 * (login + portal routes), not the public marketing website.
 *
 * `server.url` points to the Lovable sandbox preview with `#/portal` so the
 * app launches straight into the portal login. Update this to your production
 * URL (e.g. https://admission-alert-buddy.lovable.app/portal) before
 * publishing to the App Store / Play Store.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.5457fda8694041ce8cd6295d688ecd06",
  appName: "UPS Portal",
  webDir: "dist",
  server: {
    url: "https://5457fda8-6940-41ce-8cd6-295d688ecd06.lovableproject.com/portal?forceHideBadge=true",
    cleartext: true,
  },
};

export default config;
