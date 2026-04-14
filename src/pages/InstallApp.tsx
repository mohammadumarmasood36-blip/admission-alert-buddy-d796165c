import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Smartphone, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        <Link to="/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>

        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display">Install Desktop App</h1>
          <p className="text-muted-foreground">
            Install the School Portal as a desktop app for quick access — works offline too!
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3">
            <CheckCircle className="w-10 h-10 text-primary mx-auto" />
            <p className="font-semibold">App is already installed!</p>
            <p className="text-sm text-muted-foreground">Look for it in your taskbar or app launcher.</p>
          </div>
        ) : deferredPrompt ? (
          <Button size="lg" className="gap-2 w-full text-lg py-6" onClick={handleInstall}>
            <Download className="w-5 h-5" /> Install Now
          </Button>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-left space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Desktop (Chrome / Edge)
              </h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open this portal in <strong>Chrome</strong> or <strong>Edge</strong></li>
                <li>Click the <strong>install icon</strong> (⊕) in the address bar</li>
                <li>Click <strong>"Install"</strong> in the popup</li>
              </ol>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-left space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Mobile
              </h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open this portal in your mobile browser</li>
                <li><strong>Android:</strong> Tap menu (⋮) → "Add to Home Screen"</li>
                <li><strong>iPhone:</strong> Tap Share (↑) → "Add to Home Screen"</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
