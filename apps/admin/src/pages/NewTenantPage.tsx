import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eckApi } from "../api/client";

export function NewTenantPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [legacyBaseUrl, setLegacyBaseUrl] = useState("https://graph.microsoft.com");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tenant = await eckApi.createTenant({
        slug,
        name,
        legacyBaseUrl,
        contactEmail: contactEmail || undefined,
      });
      navigate(`/tenants/${tenant.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Ny tenant</h1>
      <form onSubmit={submit} className="card stack">
        <label>
          Slug (subdomæne)
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="hvidovre"
            required
          />
          <span className="hint">→ {slug || "slug"}.fp.eira-systems.eu</span>
        </label>
        <label>
          Navn
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Legacy API URL
          <input
            value={legacyBaseUrl}
            onChange={(e) => setLegacyBaseUrl(e.target.value)}
            required
          />
        </label>
        <label>
          IT kontakt (valgfri)
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Opretter…" : "Opret tenant"}
        </button>
      </form>
    </div>
  );
}
