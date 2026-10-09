"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * The year for the footer. Pages like /submit are only rebuilt on a deploy,
 * so a year written at build time would still say last year in January.
 * This shows the server's year while the page loads and the visitor's after
 * that, without a hydration mismatch.
 */
export default function CurrentYear({ serverYear }: { serverYear: number }) {
  const year = useSyncExternalStore(
    noSubscription,
    () => new Date().getFullYear(),
    () => serverYear
  );
  return <>{year}</>;
}
