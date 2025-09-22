
"use client";
import React, { useState, useEffect } from "react";
import { buttonVariants } from "@/src/components/ui/button";
import { getSessionId } from "@/src/lib/session";

export const SessionId = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSessionId(getSessionId());
  }, []);

  if (!isClient) {
    return <div className={buttonVariants({ size: "lg" })}>Loading...</div>;
  }

  return (
    <div className={buttonVariants({ size: "lg" })}>
      {sessionId || "No Session"}
    </div>
  );
};
