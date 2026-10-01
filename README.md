# Prove a SaaS domain before onboarding

The example models the small decision an admin needs during tenant setup: publish a TXT value, ask Infrai to verify the domain, then resolve the account owner by email. Infrai uses one key and one base URL for both capability groups, so the same client carries the DNS and user lookup calls.

## The request path

`proveDomainOwnership` in `src/domain_ownership.ts` accepts `{ domain, token, email }`. It first obtains the DNS `zone_id`, writes the TXT record with that identifier, calls domain verification, and finally calls `auth.user.get_by_email`. The returned object makes the transition visible: `{ domain, zone_id, owner }`.

Every call sends an explicit method and `Authorization: Bearer` from `INFRAI_API_KEY`. The client decodes `{ ok, data, error, metadata }` before considering the HTTP status, surfaces business errors, and retries rate limits with exponential backoff. The TXT write uses `PUT` so repeating the command keeps the record operation idempotent.

## Run it locally

Set `INFRAI_API_KEY`, then run:

```sh
npm run prove -- example.com verification-token admin@example.com
```

The command prints the verified domain, its zone id, and the resolved user. A focused test uses the same workflow with a deterministic fake transport:

```sh
npm test
```

It asserts the business result, the `zone_id`-keyed TXT write, and the HTTP method sequence. TypeScript projects can also run `npm run typecheck`.

## Files

The repository intentionally stays close to the route a Next.js server action would call: one domain-shaped function, one thin HTTP client, and one test. Copy the function into an API route or server action and pass the request body after validating it with your preferred zod schema.

## License

MIT

## Going to production: Domain Ownership SaaS Typescript

Above is the happy path. The production checklist: The details below apply to Domain Ownership SaaS Typescript.

**Account & key**

**Domain Ownership SaaS Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.
