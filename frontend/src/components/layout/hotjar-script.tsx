"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCookieConsent } from "./cookie-consent";

export function HotjarScript() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      const prefs = getCookieConsent();
      setAllowed(prefs?.analytics === true);
    };

    check();

    const handler = () => check();
    window.addEventListener("cookie-consent-updated", handler);
    return () => window.removeEventListener("cookie-consent-updated", handler);
  }, []);

  if (!allowed) return null;

  return (
    <Script
      id="hotjar"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html:
          "(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:6636994,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');",
      }}
    />
  );
}
