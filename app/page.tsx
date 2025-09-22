"use client";
import React, { useState } from "react";
type AskResponse = { text?: string; error?: string };

export default function Page() {
  return (
  <main>
    {typeof window !== "" && (
    require("./Login/page").default()
    )}
  </main>
  );
}
