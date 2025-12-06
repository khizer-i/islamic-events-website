"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GA4PageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!pathname) return;
        const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
        // Only fire if GA has been initialised
        // @ts-ignore
        window.gtag?.("config", "G-B1ZKLRVV29", {
            page_path: url,
        });
    }, [pathname, searchParams]);

    return null;
}
