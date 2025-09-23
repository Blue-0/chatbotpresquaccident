"use client";
import React, { useState, useEffect } from "react";
import { buttonVariants } from "@/src/components/ui/button";
import dynamic from "next/dynamic";

const SessionIdComponent = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Générer ou récupérer l'ID de session côté client uniquement
    let id = localStorage.getItem("sessionId");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("sessionId", id);
    }
    setSessionId(id);
  }, []);

  if (!mounted) {
    return <div className={buttonVariants({ size: "lg", variant: "outline"  })}>Loading...</div>;
  }

  return (
    <div className={buttonVariants({ size: "lg", variant: "outline" })}>
      {sessionId || "Loading..."}
    </div>
  );
};

// Export avec dynamic pour éviter le SSR
export const SessionId = dynamic(() => Promise.resolve(SessionIdComponent), {
  ssr: false,
  loading: () => <div className={buttonVariants({ size: "lg" })}>Loading...</div>,
});
