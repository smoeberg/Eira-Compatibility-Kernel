import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { IntegrationWorkspace } from "./IntegrationWorkspacePage";
import type { IntegrationSetup } from "../api/client";

const api = vi.hoisted(() => ({
  getIntegration: vi.fn(),
  transitionIntegration: vi.fn(),
}));
vi.mock("../api/client", () => ({ eckApi: api }));

function draft(id: string): IntegrationSetup {
  return {
    id, tenantId: "tenant-1", name: "System " + id, environment: "test",
    status: "draft", proxyUrl: "https://" + id + ".fp.example.test",
    upstreamUrl: "https://graph.example.test", observedCalls: 0, successfulCalls: 0,
    customerConfirmed: false,
  };
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("integration confirmations", () => {
  it("never carries preflight checks from integration A to B", async () => {
    api.getIntegration.mockImplementation(async (_tenant: string, id: string) => draft(id));
    api.transitionIntegration.mockImplementation(async (_tenant: string, id: string) => ({ ...draft(id), status: "ready" }));
    render(<MemoryRouter>
      <IntegrationWorkspace tenantId="tenant-1" integrationId="a" />
      <IntegrationWorkspace tenantId="tenant-1" integrationId="b" />
    </MemoryRouter>);

    await screen.findByText("System a");
    const labels = [
      "Testmiljøet er isoleret fra produktion.",
      "Fagsystemets API-base-URL kan ændres.",
      "Auth og TLS er afklaret.",
      "En rollback-ansvarlig er aftalt.",
    ];
    for (const label of labels) fireEvent.click(screen.getAllByLabelText(label)[0]);
    const buttons = screen.getAllByRole<HTMLButtonElement>("button", { name: "Godkend forhåndskontrol" });
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(api.transitionIntegration).toHaveBeenCalledWith(
      "tenant-1", "a", { type: "mark_ready", preflightConfirmed: true },
    ));
    expect(api.transitionIntegration).toHaveBeenCalledTimes(1);
  });
});
