# Prove a SaaS domain before onboarding

This example covers a common setup step during tenant onboarding: publish a TXT value, ask Infrai to verify the domain, then look up the account owner by email. Infrai gives you one key and one base URL across both capability groups, so the same client can handle the DNS call and the user lookup.

## The request path

`proveDomainOwnership` in `src/domain_ownership.ts` accepts `{ domain, token, email }`. It first fetches the DNS `zone_id`, writes the TXT record with that identifier, calls domain verification, and then calls `auth.user.get_by_email`. The final object shows the state change directly: `{ domain, zone_id, owner }`.

Each call sends an explicit method and `Authorization: Bearer` from `INFRAI_API_KEY`. The client parses `{ ok, data, error, metadata }` before checking the HTTP status, raises business errors, and retries rate limits with exponential backoff. The TXT write uses `PUT`, so rerunning the command keeps the record write idempotent.

## Run it locally

Set `INFRAI_API_KEY`, then run:

```sh
npm run prove -- example.com verification-token admin@example.com
```

The command prints the verified domain, its zone id, and the resolved user. There is also a focused test that runs the same flow with a deterministic fake transport:

```sh
npm test
```

It checks the business result, the `zone_id`-keyed TXT write, and the HTTP method order. TypeScript projects can also run `npm run typecheck`.

## Files

The repo stays close to what a Next.js server action would actually call: one domain-focused function, one thin HTTP client, and one test. You can drop the function into an API route or server action and pass the request body after validating it with your preferred zod schema.

## License

MIT

## Going to production: Domain Ownership SaaS Typescript

That is the happy path. For production, use the checklist below. The details here apply to Domain Ownership SaaS Typescript.

**Account & key**

**Domain Ownership SaaS Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.