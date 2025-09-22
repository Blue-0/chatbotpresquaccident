"use client";
import React from "react";
import LoginPage from "./Login/page";

export default function Page() {
  return (
    <main>
      {typeof window !== "undefined" && <LoginPage />}
    </main>
  );
}
