import assert from "node:assert/strict";
import { proveDomainOwnership, InfraiClient } from "../src/domain_ownership.ts";

const calls: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [];
const fakeFetch: typeof fetch = async (input, init) => {
  const url = new URL(String(input));
  calls.push({ path: url.pathname, method: String(init?.method), body: init?.body ? JSON.parse(String(init.body)) : undefined });
  const data = url.pathname.endsWith("domain/add") ? { zone_id: "zone-1" } : url.pathname.endsWith("auth/user/get_by_email") ? { id: "u1", email: "admin@example.com" } : {};
  return new Response(JSON.stringify({ ok: true, data, metadata: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
};

const result = await proveDomainOwnership({ domain: "example.com", token: "txt-proof", email: "admin@example.com" }, new InfraiClient({ fetchImpl: fakeFetch, apiKey: "test" }));
assert.equal(result.owner.id, "u1");
assert.equal(calls[1].body?.zone_id, "zone-1");
assert.equal(calls[1].body?.record_type, "TXT");
assert.deepEqual(calls.map((call) => call.method), ["POST", "PUT", "POST", "GET"]);
console.log("domain ownership decision passed");
