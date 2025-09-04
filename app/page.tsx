"use client";
import { useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAnswer("");

    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await r.json();
      if (!r.ok) {
        setError(json.error || "Erreur serveur");
      } else {
        setAnswer(json.text || "—");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur réseau";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Chatbot (stateless via webhook)</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Pose ta question…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button className="border rounded px-3" disabled={loading}>
          {loading ? "…" : "Envoyer"}
        </button>
      </form>

      <div className="flex gap-2">
        <button
          type="button"
          className="text-sm underline"
          onClick={() => { setPrompt(""); setAnswer(""); setError(null); }}
        >
          Réinitialiser (aucun historique)
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {answer && (
        <div className="border rounded p-3 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </main>
  );
}