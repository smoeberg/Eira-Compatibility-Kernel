import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { eckApi, type Tenant } from "../api/client";
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
    return <div className="page">{error ? <p role="alert" className="error">{error}</p> : <p role="status">Indlæser…</p>}</div>;
  }

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Dashboard
      </Link>
      <header className="stack gap-sm">
        <h1>{tenant.name}</h1>
        {tenant.contactEmail && <p className="muted">Kontakt: {tenant.contactEmail}</p>}
        <p className="muted">Opret en integration nedenfor for at få dens unikke proxyadresse.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <IntegrationSetupPanel tenantId={id!} />
    </div>
  );
}
