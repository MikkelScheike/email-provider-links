# Release notes (pending semantic-release)

Date: 2025-12-09

These notes summarize changes since v4.0.10. The actual version will be assigned by semantic-release after CI runs.

## Fixes
- Update cryptographic verification hashes used by `src/hash-verifier.ts` to match current `providers/emailproviders.json` and `package.json` contents, ensuring runtime integrity checks continue to pass.

## Chores / DX
- Remove `.nvmrc` from the repository and add it to `.gitignore` so the project does not enforce a specific Node.js version for contributors.
  - No change to runtime requirements; CI will continue to validate with the matrix in workflows.

## Quality
- All tests passing (1 skipped) under Node v25.2.1; build verified.

## Reference commits
- fix: update security hashes and prepare for release (d47f9dc)
- chore: ignore .nvmrc and remove file (6685879)

Notes:
- Semantic-release will determine the final version number based on commit messages and publish the release, tag, and notes automatically in CI.