"use client";

import { useEffect, useRef, useState } from "react";

import { env } from "@WhatLead/env/web";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        params: { sitekey: string; callback: (t: string) => void }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget(props: {
  onToken: (token: string) => void;
}): JSX.Element | null {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    const ensureScript = async (): Promise<void> => {
      if (window.turnstile) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          "script[data-whatlead-turnstile]"
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("turnstile_load_failed")),
            {
              once: true,
            }
          );
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.whatleadTurnstile = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("turnstile_load_failed"));
        document.head.appendChild(script);
      });
    };

    let disposed = false;

    void (async () => {
      await ensureScript();
      if (disposed) return;
      if (!ref.current || !window.turnstile) return;

      const id = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t) => props.onToken(t),
      });
      widgetIdRef.current = id;
      setIsReady(true);
    })();

    return () => {
      disposed = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [props.onToken, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={ref} data-ready={isReady ? "true" : "false"} />;
}
