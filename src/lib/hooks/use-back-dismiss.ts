"use client";

import * as React from "react";

/**
 * Hook to dismiss open modals, sheets, and drawers on browser Back / mobile swipe back (Rule 004).
 */
export function useBackDismiss(isOpen: boolean, onClose: () => void) {
  const isPushedRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      // Push history state so browser Back can intercept dismissal
      window.history.pushState({ modalDismiss: true }, "");
      isPushedRef.current = true;

      const handlePopState = (event: PopStateEvent) => {
        isPushedRef.current = false;
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If closed without popstate (e.g. user clicked close button), revert history entry
        if (isPushedRef.current) {
          isPushedRef.current = false;
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);
}
