import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { eckApi, type Tenant } from "../api/client";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    eckApi
      .getTenant(id)
      .then(setTenant)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) {
    return <div className="page"><p className="error">{error}</p></div>;
  }
  if (!tenant) {
    return <div className="page">Indlæser…</div>;
  }

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Oversigt
      </Link>
      <header className="stack gap-sm">
        <h1>{tenant.name}</h1>
        <p className="muted mono">{tenant.slug}</p>
      </header>
      <section className="card stack">
        <h2>Foranalyse</h2>
        <p className="muted">
          Upload af godkendte rapportfiler og visning af fund pr. fagsystem bygges efter ADR-001 og
          ADR-002. Rådata forlader aldrig kommunen.
        </p>
      </section>
    </div>
  );
}
