# SectorX83

SectorX83 is an independent private society and public-source research workspace.

## Phase plan

### Phase 1 — visual foundation
- Responsive research dashboard and navigation.
- Public-source news index through the GDELT DOC API.
- Global geographic context view (illustrative, not operational tracking).
- Civil nuclear project and public Earth-imagery source directory.
- Public city-camera and broadcast directory.
- Defence policy, institutional influence and research source pages.
- Server-side Groq analyst route, ready for configuration.

### Phase 2 — connected services
- Supabase authentication, membership roles and row-level security.
- Groq-powered research with saved reports and evidence/source references.
- Member archive, governance records, notifications and scheduled briefings.
- Persistent source ingestion and monitoring.

## Local development

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
``

Open http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` when configuring the AI integration.

- `GROQ_API_KEY`: private server-side Groq key (Phase 2 activation).
- `GROQ_MODEL`: optional Groq model override.

Never expose secrets in client-side code or commit them to Git.

## Data and source notes

- Headlines are requested from the GDELT DOC API and link to their publisher URLs.
- Nuclear project records link to IAEA, Global Energy Monitor and independent reporting resources.
- Earth imagery links to NASA Worldview and the Copernicus Browser. Always retain the actual acquisition date and imagery source when adding image records.
- Public camera links are publisher-controlled directories. A link is not a guarantee that a stream is currently online.
- The global map graphic is illustrative. It does not display live unit positions, targeting information or simulated incident markers.

## Deployment

The repository is connected to Vercel for automatic deployments from `main`. The intended project hostname is `sx83.vercel.app`, subject to Vercel alias availability.
