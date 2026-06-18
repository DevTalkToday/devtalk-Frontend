# Project Instructions

- Do not introduce, assume, or fallback to custom domains unless the user explicitly asks to move the service to that domain.
- Do not add `devtalk.kr` or any other unrequested domain to API proxy candidates, deployment settings, OAuth redirect settings, CORS settings, or environment examples.
- Use only endpoints that are already configured in the repository/environment or explicitly provided by the user.
- Current frontend hosting is Vercel. Current backend target is the existing VM API endpoint/configuration, not an inferred custom domain.

## Deployment & Operations

- **Post-deploy API health check**: After every commit and push, verify the response speed of frequently-used API endpoints on the deployed service (e.g., `/posts`). If response times are abnormal or requests fail, investigate the root cause and resolve it before considering the task complete.

## Error Resolution

- **Root cause first**: When fixing any bug or error, always identify the exact root cause through investigation (logs, reproduction, debugging) before applying a fix. Do not patch symptoms or guess at a solution without confirming why the issue occurred.

## Communication Style

- **Minimize noise during work**: While making changes, avoid sending unnecessary intermediate text, narration, or commentary. Keep output focused on the actual work.
- **Summarize at the end**: Once a task is complete, provide a brief summary covering the root cause (if it was a bug/error fix) and the specific changes made. Keep the summary concise — no unnecessary elaboration.