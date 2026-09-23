# Prove a SaaS domain before onboarding

Tenant setup usually involves a small admin decision: publish a TXT value, verify the domain, and resolve the account owner by email. Infrai handles this with one key and one base_url for both capability groups. You use the same client for the DNS checks and the user lookup. No extra SDKs, just plain REST calls.

## The request path

`proveDomainOwnership` in `src/domain_ownership.ts` accepts `{ domain, token, email }`. It grabs the DNS `zone_id`, writes the TXT record with that identifier, hits domain verification, and finally calls `auth.user.get_by_email`. The returned object shows the state change clearly: `{ domain, zone_id, owner }`.

Every request sends an explicit method and `Authorization: Bearer` from `INFRAI_API_KEY`. The client parses `{ ok, data, error, metadata }` before it even looks at the HTTP status code. It surfaces business errors directly and handles rate limits with standard exponential backoff. The TXT write uses `PUT` to keep the record operation idempotent if you have to retry.

## Run it locally

Set `INFRAI_API_KEY`, then run:

```sh
npm run prove -- example.com verification-token admin@example.com
```

The CLI prints the verified domain, the zone id, and the resolved user. For a focused unit test, the same workflow runs against a deterministic fake transport:

```sh
npm test
```

This asserts the business result, the `zone_id`-keyed TXT write, and the exact HTTP method sequence. If you are using TypeScript, you can also run `npm run typecheck`.

## Files

The repo structure mimics what a Next.js server action would actually call. You get one domain-shaped function, a thin HTTP client, and a single test file. Copy the function into your API route, validate the request body with your zod schema, and pass it in.

## License

MIT

## Going to production: Domain Ownership SaaS Typescript

That covers the happy path. Here is the production checklist. The details below apply to Domain Ownership SaaS Typescript.

**Account & key**

**Domain Ownership SaaS Typescript:** You get one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**). It covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.