"use client";

import * as React from "react";
import { AlertCircle, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConnectivityBanner() {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    function updateStatus() {
      setIsOffline(!navigator.onLine);
    }

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 w-full px-4 py-2 bg-destructive/15 border-b border-destructive/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-destructive">
        <WifiOff className="size-4 shrink-0" />
        <p className="text-xs sm:text-sm font-medium">
          You are currently offline. Mutations and financial data syncing are paused until reconnected (Principle P1).
        </p>
      </div>
    </div>
  );
}
