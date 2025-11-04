"use client";
import React from "react";
import { buttonVariants } from "@/src/components/ui/button";
import dynamic from "next/dynamic";
import { useSessionId } from "@/app/hooks/useSessionId";

const SessionIdComponent = () => {
  const { sessionId, isLoaded } = useSessionId();

  if (!isLoaded) {
    return <div className={buttonVariants({ size: "lg", variant: "outline"  })}>Loading...</div>;
  }

  // Tronquer à 11 caractères + "..." pour l'affichage
  const displaySessionId = sessionId ? `${sessionId.substring(0, 11)}...` : "Loading...";

  return (
    <div
      className={buttonVariants({ size: "lg", variant: "outline" })}
      title={sessionId} // Afficher le sessionId complet au survol
    >
      {displaySessionId}
    </div>
  );
};

// Export avec dynamic pour éviter le SSR
export const SessionId = dynamic(() => Promise.resolve(SessionIdComponent), {
  ssr: false,
  loading: () => <div className={buttonVariants({ size: "lg" })}>Loading...</div>,
});
