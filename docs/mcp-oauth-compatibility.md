# NSM Shop Manager MCP compatibility work (draft)

This branch is for compatibility changes only. Do not merge or deploy until the integration has passed authentication and write-safety tests.

## Current production behavior
- Edge Function: `nsm-orders` (production currently version 6).
- MCP endpoint: `/functions/v1/nsm-orders/mcp`.
- Current handler accepts JSON-RPC `tools/list`, `tools/call`, and a nonstandard `server/discover`.
- It does not currently implement standard MCP `initialize`, `notifications/initialized`, or `ping`.
- It only accepts POST and does not expose OAuth protected-resource metadata.
- OAuth access tokens are validated with Supabase Auth and restricted to the configured OAuth client ID. Private review/approval endpoints require the gateway secret.
- The existing order draft and explicit user approval controls must remain unchanged.

## Required implementation
1. Implement MCP `initialize` with a supported protocol version, `serverInfo`, and `capabilities.tools`; accept `notifications/initialized` and `ping`. Verify MCP client compatibility against current specification.
2. Expose OAuth 2.0 protected-resource metadata at the appropriate well-known resource paths, with the canonical MCP resource URL and Supabase authorization server. Return a standards-compliant `WWW-Authenticate` challenge for unauthenticated MCP calls.
3. Verify Supabase OAuth authorization-server discovery and endpoint URLs using actual responses, rather than guessing settings.
4. Preserve the signed-in user check, exact OAuth client ID restriction, gateway protection on non-MCP endpoints, and server-side explicit approval requirements.
5. Test unauthenticated, malformed, expired, wrong-client, and valid OAuth tokens; test MCP initialization, tools/list, and prepare-only flow. No production test orders should be saved.
6. Deploy to staging and confirm ChatGPT connection before promoting to production.

## Status
Design and review only. No production deployment from this branch.
