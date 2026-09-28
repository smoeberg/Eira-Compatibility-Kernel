#!/usr/bin/env node
/**
 * Generate Envoy config from tenants JSON (export from DB or manual).
 * Usage: node tools/generate-envoy-config.mjs [tenants.json] > infra/envoy/generated.yaml
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] ?? join(__dirname, "tenants.example.json");
const tenants = JSON.parse(readFileSync(inputPath, "utf-8")).tenants;

const analysisHost = process.env.ECK_ANALYSIS_HOST ?? "api";
const analysisPort = process.env.ECK_ANALYSIS_PORT ?? "3000";

function parseLegacy(url) {
  const u = new URL(url);
  return { host: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80) };
}

const legacyClusters = tenants
  .map((t) => {
    const { host, port } = parseLegacy(t.legacy_base_url);
    return `
  - name: legacy_${t.slug}
    type: STRICT_DNS
    load_assignment:
      cluster_name: legacy_${t.slug}
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address: { address: ${host}, port_value: ${port} }`;
  })
  .join("\n");

const virtualHosts = tenants
  .map((t) => {
    const fpDomain = process.env.ECK_FP_DOMAIN ?? "fp.eira-systems.eu";
    return `
            - name: ${t.slug}
              domains: ["${t.slug}.${fpDomain}"]
              routes:
              - match: { prefix: "/" }
                route:
                  cluster: legacy_${t.slug}
                  request_mirror_policies:
                  - cluster: eck_analysis
                    runtime_fraction:
                      default_value: { numerator: 100, denominator: HUNDRED }`;
  })
  .join("\n");

const yaml = `# Generated — do not edit by hand
static_resources:
  listeners:
  - name: fp_listener
    address:
      socket_address: { address: 0.0.0.0, port_value: 8443 }
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: fp_ingress
          route_config:
            name: fp_routes
            virtual_hosts:${virtualHosts}
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:${legacyClusters}
  - name: eck_analysis
    type: STRICT_DNS
    load_assignment:
      cluster_name: eck_analysis
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address: { address: ${analysisHost}, port_value: ${analysisPort} }
`;

const out = join(__dirname, "../infra/envoy/generated.yaml");
writeFileSync(out, yaml);
console.error(`Wrote ${out} (${tenants.length} tenants)`);
