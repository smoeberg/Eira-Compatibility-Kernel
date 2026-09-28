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
          <h1>Fingerprint — oversigt</h1>
          <p className="muted">Hosted på Eira · ingen kommunal DNS</p>
        </div>
        <Link className="button" to="/tenants/new">
          + Ny tenant
        </Link>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {tenants.map((t) => (
          <Link key={t.id} to={`/tenants/${t.id}`} className="card tenant-card">
            <strong>{t.name}</strong>
            <span className="mono">{t.proxyUrl}</span>
            <span className="muted">{t.legacyBaseUrl}</span>
          </Link>
        ))}
        {tenants.length === 0 && !error && (
          <p className="muted">Ingen tenants endnu — opret den første.</p>
        )}
      </div>
    </div>
  );
}
