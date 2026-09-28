import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  eckApi,
  type FingerprintRun,
  type SetupPayload,
  type Tenant,
} from "../api/client";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [runs, setRuns] = useState<FingerprintRun[]>([]);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!id) return;
    const [t, r, active] = await Promise.all([
      eckApi.getTenant(id),
      eckApi.listRuns(id),
      eckApi.getActiveSetup(id),
    ]);
    setTenant(t);
    setRuns(r);
    setSetup(active.setup);
  }

  useEffect(() => {
    refresh().catch((e) => setError((e as Error).message));
  }, [id]);

  async function startRun() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      await eckApi.startRun(id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!tenant) {
    return <div className="page">Indlæser…</div>;
  }

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Dashboard
      </Link>
      <header className="stack gap-sm">
        <h1>{tenant.name}</h1>
        <p className="mono">{tenant.proxyUrl}</p>
        <p className="muted">Legacy: {tenant.legacyBaseUrl}</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="card stack">
        <h2>Fingerprint</h2>
        {setup ? (
          <>
            <p>
              Aktiv run — <strong>{setup.daysRemaining}</strong> dage tilbage
            </p>
            <SetupBlock setup={setup} />
            <Link className="button secondary" to={`/runs/${setup.runId}`}>
              Se run-detaljer
            </Link>
          </>
        ) : (
          <>
            <p className="muted">Ingen aktiv fingerprint (14 dage).</p>
            <button onClick={startRun} disabled={loading}>
              {loading ? "Starter…" : "Start fingerprint"}
            </button>
          </>
        )}
      </section>

      <section>
        <h2>Historik</h2>
        <ul className="run-list">
          {runs.map((run) => (
            <li key={run.id}>
              <Link to={`/runs/${run.id}`}>
                {run.status} · slutter {run.endsAt.slice(0, 10)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SetupBlock({ setup }: { setup: SetupPayload }) {
  const copy = `${setup.proxyUrl}`;
  return (
    <div className="setup stack">
      <div>
        <span className="label">Proxy-URL (indsæt i fagsystem)</span>
        <code className="block">{copy}</code>
        <button
          type="button"
          className="secondary small"
          onClick={() => navigator.clipboard.writeText(copy)}
        >
          Kopiér
        </button>
      </div>
      <ol>
        {setup.instructions.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </div>
  );
}
