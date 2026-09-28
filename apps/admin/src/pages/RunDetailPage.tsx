import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  eckApi,
  type CompatibilityReportResponse,
  type SetupPayload,
} from "../api/client";
import { SetupBlock } from "./TenantDetailPage";

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [report, setReport] = useState<CompatibilityReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    eckApi
      .getSetup(runId)
      .then(setSetup)
      .catch((e) => setError((e as Error).message));
  }, [runId]);

  async function complete() {
    if (!runId) return;
    setLoading(true);
    try {
      setReport(await eckApi.completeRun(runId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReport() {
    if (!runId) return;
    try {
      setReport(await eckApi.getReport(runId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const r = report?.report;

  return (
    <div className="page">
      <Link to="/" className="back">
        ← Dashboard
      </Link>
      <h1>Run {runId?.slice(0, 8)}…</h1>
      {error && <p className="error">{error}</p>}
      {setup && <SetupBlock setup={setup} />}
      <div className="row gap">
        <button onClick={complete} disabled={loading}>
          Afslut & generér rapport
        </button>
        <button className="secondary" onClick={loadReport}>
          Hent rapport
        </button>
      </div>
      {r && (
        <div className="card report">
          <p className="disclaimer">
            <strong>Disclaimer:</strong> {r.disclaimers.primary}
          </p>
          <p className="muted">{r.disclaimers.secondary}</p>
          <h2>Compatibility Score: {r.score.totalPercent}%</h2>
          <p>{r.score.recommendationLabel}</p>
          <p>
            {r.observation.callCount} kald · {r.observation.uniqueEndpoints}{" "}
            unikke endpoints · matrix v{r.score.matrixVersion}
          </p>
          {r.gaps.length > 0 && (
            <>
              <h3>Gaps ({r.gaps.length})</h3>
              <ul>
                {r.gaps.slice(0, 15).map((g) => (
                  <li key={`${g.method}-${g.path}`}>
                    <code>
                      {g.method} {g.path}
                    </code>{" "}
                    ({g.callCount}×)
                  </li>
                ))}
              </ul>
            </>
          )}
          <details>
            <summary>Fuld rapport (JSON)</summary>
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
