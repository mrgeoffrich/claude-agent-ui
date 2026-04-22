---
name: release
description: Create a new versioned release of claude-agent-ui. Use this skill whenever the user wants to cut a release, bump the version, publish a new version, or tag a new release of this project. Triggers on phrases like "create a release", "bump the version", "release a new version", "tag a release", "publish a new version".
---

# Release Skill

Automates bumping the version, committing, tagging, and creating a GitHub release for this project.

## Steps

### 1. Ask the user what kind of version bump they want

Use the `AskUserQuestion` tool with these options:
- **Patch** — bug fixes, e.g. 0.1.10 → 0.1.11
- **Minor** — new features, e.g. 0.1.10 → 0.2.0
- **Major** — breaking changes, e.g. 0.1.10 → 1.0.0

### 2. Run the bump script

```bash
node scripts/bump-version.mjs <patch|minor|major>
```

This updates `packages/react/package.json` and `packages/tailwind-preset/package.json` in lockstep and prints the new version (e.g. `Bumping 0.1.10 -> 0.1.11`).

### 3. Commit, tag, and push

```bash
git add packages/react/package.json packages/tailwind-preset/package.json
git commit -m "chore: release v<NEW_VERSION>"
git push
git tag v<NEW_VERSION>
git push origin v<NEW_VERSION>
```

### 4. Create the GitHub release

```bash
gh release create v<NEW_VERSION> \
  --title "v<NEW_VERSION>" \
  --notes "Release v<NEW_VERSION>." \
  --repo mrgeoffrich/claude-agent-ui
```

### 5. Report back

Tell the user the release was created and link to it on GitHub. The publish workflow will trigger automatically and publish both npm packages.
