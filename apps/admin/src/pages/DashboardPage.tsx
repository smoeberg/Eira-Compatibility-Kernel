import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eckApi, getAdminKey, type Tenant } from "../api/client";

export function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminKey()) return;
    eckApi
      .listTenants()
      .then(setTenants)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="page">
      <header className="row">
        <div>
          <h1>Office-foranalyse — kommuner</h1>
          <p className="muted">Kun godkendte rapportfiler modtages (ADR-001)</p>
        </div>
        <Link className="button" to="/tenants/new">
          + Ny kommune
        </Link>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {tenants.map((t) => (
          <Link key={t.id} to={`/tenants/${t.id}`} className="card tenant-card">
            <strong>{t.name}</strong>
            <span className="mono">{t.slug}</span>
          </Link>
        ))}
        {tenants.length === 0 && !error && (
          <p className="muted">Ingen kommuner endnu — opret den første.</p>
        )}
      </div>
    </div>
  );
}
