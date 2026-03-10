"use client";

import { SessionProvider } from "./contexts/SessionContext";

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
