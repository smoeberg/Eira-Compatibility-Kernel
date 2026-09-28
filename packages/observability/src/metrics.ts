interface HttpSample {
  service: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

const httpRequestsTotal = new Map<string, number>();
const httpDurationSum = new Map<string, number>();
const httpDurationCount = new Map<string, number>();

function key(parts: Record<string, string | number>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

export function recordHttpRequest(sample: HttpSample): void {
  const labels = {
    service: sample.service,
    method: sample.method,
    path: sample.path,
    status: sample.statusCode,
  };
  const k = key(labels);
  httpRequestsTotal.set(k, (httpRequestsTotal.get(k) ?? 0) + 1);

  const durationKey = key({
    service: sample.service,
    method: sample.method,
    path: sample.path,
  });
  httpDurationSum.set(
    durationKey,
    (httpDurationSum.get(durationKey) ?? 0) + sample.durationMs,
  );
  httpDurationCount.set(
    durationKey,
    (httpDurationCount.get(durationKey) ?? 0) + 1,
  );
}

function parseKey(k: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of k.split(",")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i)] = part.slice(i + 1);
  }
  return out;
}

function formatLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([n, v]) => `${n}="${String(v).replace(/"/g, '\\"')}"`)
    .join(",");
}

export function renderPrometheusMetrics(service: string): string {
  const lines: string[] = [
    "# HELP eck_http_requests_total Total HTTP requests",
    "# TYPE eck_http_requests_total counter",
  ];

  for (const [k, value] of httpRequestsTotal) {
    const labels = parseKey(k);
    lines.push(
      `eck_http_requests_total{${formatLabels(labels)}} ${value}`,
    );
  }

  lines.push(
    "# HELP eck_http_request_duration_ms_sum HTTP request duration sum ms",
    "# TYPE eck_http_request_duration_ms_sum counter",
  );
  for (const [k, value] of httpDurationSum) {
    const labels = parseKey(k);
    lines.push(
      `eck_http_request_duration_ms_sum{${formatLabels(labels)}} ${value}`,
    );
  }

  lines.push(
    "# HELP eck_http_request_duration_ms_count HTTP request duration count",
    "# TYPE eck_http_request_duration_ms_count counter",
  );
  for (const [k, value] of httpDurationCount) {
    const labels = parseKey(k);
    lines.push(
      `eck_http_request_duration_ms_count{${formatLabels(labels)}} ${value}`,
    );
  }

  lines.push(
    "# HELP eck_up Service is running",
    "# TYPE eck_up gauge",
    `eck_up{service="${service}"} 1`,
  );

  return `${lines.join("\n")}\n`;
}
