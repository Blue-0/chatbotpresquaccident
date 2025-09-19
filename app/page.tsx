"use client";
import { useState } from "react";

type AskResponse = { text?: string; error?: string };

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);     // efface l'erreur précédente
    setAnswer("");      // efface la réponse précédente => "sans historique"
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json: AskResponse = await r.json();
      if (!r.ok) {
        setError(json.error || "Erreur serveur");
      } else {
        setAnswer(json.text || "—");
      }
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Chat (stateless, via webhook)</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <label htmlFor="prompt">Ta question</label>
        <textarea
          id="prompt"
          placeholder="Pose ta question…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          style={{ padding: 8 }}
        />
        <button type="submit" disabled={loading || !prompt.trim()} aria-busy={loading}>
          {loading ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      {error && <div role="alert" style={{ color: "crimson" }}>{error}</div>}

      {answer && (
        <section aria-live="polite" style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          {answer}
        </section>
      )}
    </main>
  );
}
