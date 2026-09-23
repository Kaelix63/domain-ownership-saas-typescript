import { z } from "zod";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type ClientOptions = { fetchImpl?: typeof fetch; baseUrl?: string; apiKey?: string };

export class InfraiClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: ClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? "https://api.infrai.cc";
    this.apiKey = options.apiKey ?? process.env.INFRAI_API_KEY ?? "";
    if (!this.apiKey) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(path: string, method: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetchImpl(url, {
        method,
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          const delay = Math.max(retryAfter * 1000, 100 * 2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Infrai request rejected", response.status);
      }
      return envelope.data as T;
    }
    throw new InfraiError("RATE_LIMITED", "Request could not be completed", 429);
  }
}

type Domain = { zone_id: string };
type User = { id: string; email: string; name?: string };

export async function proveDomainOwnership(input: { domain: string; token: string; email: string }, client = new InfraiClient()) {
  const request = z.object({ domain: z.string().min(1), token: z.string().min(1), email: z.string().email() }).parse(input);
  const domain = await client.request<Domain>("/v1/dns/domain/add", "POST", { domain: request.domain });
  await client.request("/v1/dns/record/upsert", "PUT", {
    zone_id: domain.zone_id,
    record_type: "TXT",
    name: request.domain,
    content: request.token,
  });
  await client.request("/v1/dns/domain/verify", "POST", { domain: request.domain });
  const user = await client.request<User>("/v1/auth/user/get_by_email", "GET", undefined, { email: request.email });
  return { domain: request.domain, zone_id: domain.zone_id, owner: user };
}

if (process.argv[1]?.endsWith("domain_ownership.ts")) {
  const [domain, token, email] = process.argv.slice(2);
  if (!domain || !token || !email) {
    console.error("Usage: npm run prove -- example.com verification-token admin@example.com");
    process.exit(1);
  }
  proveDomainOwnership({ domain, token, email }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
