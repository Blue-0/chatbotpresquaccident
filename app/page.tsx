"use client";
import React, { useState } from "react";

type AskResponse = { text?: string; error?: string };

export default function Page() {
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

      // On tente de parser le JSON en sécurisant un minimum
      const json = (await r.json()) as unknown;
      const data: AskResponse =
        typeof json === "object" && json !== null
          ? (json as AskResponse)
          : {};

      if (!r.ok) {
        setError(data.error || "Erreur serveur");
      } else {
        setAnswer(data.text || "—");
      }
    } catch (err) {
      // plus de "any" : on affine le type de manière sûre
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setPrompt(e.target.value)
          }
          rows={5}
          style={{ padding: 8 }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          aria-busy={loading}
        >
          {loading ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      {error && (
        <div role="alert" style={{ color: "crimson" }}>
          {error}
        </div>
      )}

      {answer && (
        <section
          aria-live="polite"
          style={{
            whiteSpace: "pre-wrap",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {answer}
        </section>
      )}
    </main>
  );
}
