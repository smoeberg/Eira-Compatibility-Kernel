import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { eckApi, type Tenant, type SetupPayload } from "../api/client";
import { IntegrationSetupPanel } from "./IntegrationSetupPanel";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    setTenant(await eckApi.getTenant(id));
  }

  useEffect(() => {
    refresh().catch((e) => setError((e as Error).message));
  }, [id]);

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
        <p className="muted">Opret en integration nedenfor for at få dens unikke proxyadresse.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <IntegrationSetupPanel tenantId={id!} />
    </div>
  );
}

/** Historical run view; new observations use IntegrationSetupPanel. */
export function SetupBlock({ setup }: { setup: SetupPayload }) {
  return <div className="setup stack">
    <code className="block">{setup.proxyUrl}</code>
    <ol>{setup.instructions.map((line) => <li key={line}>{line}</li>)}</ol>
  </div>;
}
