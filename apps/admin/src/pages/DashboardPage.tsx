import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eckApi, type IntegrationSetup, type Tenant } from "../api/client";

type TenantOverview = { tenant: Tenant; integrations: IntegrationSetup[] };

export function DashboardPage() {
  const [tenants, setTenants] = useState<TenantOverview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    eckApi.listTenants()
      .then(async (list) => Promise.all(list.map(async (tenant) => ({
        tenant, integrations: await eckApi.listIntegrations(tenant.id),
      }))))
      .then((overview) => { if (mounted) setTenants(overview); })
      .catch((e) => { if (mounted) setError((e as Error).message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
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

      {error && <p role="alert" className="error">{error}</p>}
      {loading && <p role="status">Henter tenants og integrationer…</p>}

      {!loading && !error && <section className="card stack" aria-label="Kræver handling">
        <h2>Kræver handling</h2>
        {tenants.flatMap(({ tenant, integrations }) => integrations
          .filter((item) => ["awaiting_traffic", "passthrough_only", "rollback_pending", "incident"].includes(item.status))
          .map((item) => <Link key={item.id} to={`/tenants/${tenant.id}/integrations/${item.id}`}>
            {tenant.name} / {item.name} — {item.status === "incident" ? "Hændelse" :
              item.status === "awaiting_traffic" ? "Venter på kald" : "Rollback kræver handling"}
          </Link>))}
        {tenants.every(({ integrations }) => integrations.every((item) =>
          !["awaiting_traffic", "passthrough_only", "rollback_pending", "incident"].includes(item.status))) &&
          <p className="muted">Ingen integrationer kræver handling.</p>}
      </section>}

      <div className="grid">
        {tenants.map(({ tenant, integrations }) => (
          <Link key={tenant.id} to={`/tenants/${tenant.id}`} className="card tenant-card">
            <strong>{tenant.name}</strong>
            <span className="muted">{integrations.length} integrationer · {integrations.filter((i) => i.status === "active").length} aktive observationer</span>
          </Link>
        ))}
        {tenants.length === 0 && !loading && !error && (
          <p className="muted">Ingen tenants endnu — opret den første.</p>
        )}
      </div>
    </div>
  );
}
