"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function GA4PageView() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;

        // @ts-expect-error – gtag is injected by GA4 script
        window.gtag?.("config", "G-B1ZKLRVV29", {
            page_path: pathname,
        });
    }, [pathname]);

    return null;
}
