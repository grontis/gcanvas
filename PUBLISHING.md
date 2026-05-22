# Publishing `@grontis/gcanvas`

This document is for **maintainers** releasing the library to **GitHub Packages**
(`https://npm.pkg.github.com`). Consumer-facing install instructions live in
[`projects/gcanvas/README.md`](projects/gcanvas/README.md).

---

## TL;DR

```bash
# 1. Make sure main is clean, tests pass, library builds
ng test gcanvas --no-watch --browsers=ChromeHeadless
ng build gcanvas --configuration=production

# 2. Bump the version in projects/gcanvas/package.json
#    (e.g. 0.1.0 -> 0.1.1, 0.2.0, 1.0.0)

# 3. Commit, tag, push
git add projects/gcanvas/package.json
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

Pushing the `vX.Y.Z` tag triggers
[`.github/workflows/publish.yml`](.github/workflows/publish.yml), which builds
`dist/gcanvas` and publishes it to GitHub Packages using the workflow's
built-in `GITHUB_TOKEN`. **No manual secrets to configure.**

---

## 1. What gets published

Only `dist/gcanvas/` is published — never the project root. The publish step in
the workflow runs from that directory.

The library `package.json` (`projects/gcanvas/package.json`) is the source of
truth for everything that ends up in the published manifest:

| Field | Why it matters |
|---|---|
| `name` | Must be scoped (`@grontis/...`) to publish to GitHub Packages under the `grontis` user/org |
| `version` | Must be unique. Re-publishing the same version returns HTTP 409 |
| `publishConfig.registry` | Pins publish target to `npm.pkg.github.com` even if a user's `~/.npmrc` defaults elsewhere |
| `peerDependencies` | Consumers' Angular and TipTap versions are validated against these ranges |
| `repository.url` | GitHub Packages uses this to associate the package with the repo (and inherit visibility) |
| `license` | Surfaced on the package page and to consumers |

The Angular CLI (`ng-packagr`) is what builds `dist/gcanvas`. Its config lives
in [`projects/gcanvas/ng-package.json`](projects/gcanvas/ng-package.json).

---

## 2. Prerequisites

### One-time repo setup (already done)

- `.github/workflows/publish.yml` exists and listens on `v*` tags.
- The workflow has `permissions: packages: write` — required to publish.
- Root `.npmrc` scopes `@grontis` to `npm.pkg.github.com` so local installs
  resolve the package from the right registry.

### One-time GitHub account setup (per maintainer)

You only need a personal token for **local manual publishing** or **local
installs of the published package**. The CI workflow does not need one.

1. Create a fine-grained PAT at <https://github.com/settings/tokens>:
   - **For publishing locally**: scope `write:packages` (includes `read:packages`)
   - **For installing the published package locally**: scope `read:packages`
2. Add it to your user-level npm config (do **not** commit):

   ```bash
   # ~/.npmrc
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
   ```

   The repo's `.npmrc` only sets the scope; the token must come from
   `~/.npmrc` or an `NODE_AUTH_TOKEN` env var.

---

## 3. Pre-release checklist

Run through this before every release:

- [ ] Working tree clean (`git status` shows no uncommitted changes).
- [ ] You're on `main` and up to date with `origin/main`.
- [ ] Public API exports reviewed — `projects/gcanvas/src/public-api.ts` reflects
      every type/component/service consumers should reach.
- [ ] Tests pass: `ng test gcanvas --no-watch --browsers=ChromeHeadless`
      (see [§8 — Tests can't find a Chrome binary](#tests-cant-find-a-chrome-binary)
      if Karma can't launch the browser).
- [ ] Production build succeeds locally: `ng build gcanvas --configuration=production`.
- [ ] `projects/gcanvas/README.md` mentions every new public API (consumers see
      this file on the npm/GitHub Packages page).
- [ ] Root `README.md` reflects any cross-cutting changes.
- [ ] `projects/gcanvas/package.json` version bumped per SemVer (see §4).
- [ ] (Optional) A `CHANGELOG.md` entry — not required, but recommended once
      external consumers exist.

---

## 4. Versioning

The library follows [SemVer](https://semver.org/). While pre-1.0:

| Change | Bump |
|---|---|
| Bug fix, doc-only, internal refactor | `0.x.y` → `0.x.(y+1)` (patch) |
| New public API, additive change | `0.x.y` → `0.(x+1).0` (minor) |
| Breaking change to any exported symbol, input, output, or token contract | `0.x.y` → `0.(x+1).0` (minor — pre-1.0 minors carry breakage) |

After 1.0, breaking changes require a major bump.

**Anything reachable from `projects/gcanvas/src/public-api.ts` counts as public API.**
That includes:

- Component selectors, inputs, outputs (e.g. `<gc-canvas-editor>`'s `(publish)` signature)
- Service classes (`CanvasSerializer`, `CanvasStateService`, …)
- `InjectionToken` shapes (`ELEMENT_SERIALIZER_TOKEN`, `IMAGE_RESOLVER_TOKEN`, …)
- Model interfaces (`CanvasData`, `PublishPayload`, …)
- CSS custom property names (`--gc-*` tokens) — these are part of the theming contract

### Pre-releases

For unstable changes you want to publish for testing without anyone treating
them as stable:

```bash
# Bump package.json version to e.g. "0.2.0-alpha.1"
git tag v0.2.0-alpha.1
git push origin main --tags
```

npm/GitHub Packages will not resolve pre-release versions to consumers using
range selectors like `^0.2.0`. They must opt in with `@grontis/gcanvas@next` or
the explicit version.

---

## 5. Release flow

### Standard release (CI-driven, recommended)

```bash
# Make sure everything is clean and tested
git checkout main
git pull --rebase origin main
ng test gcanvas --no-watch --browsers=ChromeHeadless
ng build gcanvas --configuration=production

# Bump version
$EDITOR projects/gcanvas/package.json   # change "version" field

# Commit + tag (tag name MUST match package.json: vX.Y.Z)
git add projects/gcanvas/package.json
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

Then watch the workflow:

```bash
gh run watch
# or: gh workflow view "Publish to GitHub Packages"
```

When it succeeds the package shows up under
<https://github.com/grontis/gcanvas/packages>.

### Manual publish (fallback)

If the workflow is broken or you want to publish from your machine:

```bash
# Authenticate npm with a token that has write:packages
export NODE_AUTH_TOKEN=ghp_yourTokenHere

# Build a fresh artifact
ng build gcanvas --configuration=production

# Publish from inside the built artifact
cd dist/gcanvas
npm publish
```

You still want to tag the commit afterward so the version is traceable:

```bash
git tag v0.2.0
git push origin --tags
```

---

## 6. What the workflow does

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) on every
`v*` tag:

1. Checks out the tagged commit.
2. Sets up Node 20 with the registry pre-configured for `@grontis`.
3. `npm ci` — installs from `package-lock.json`.
4. `npx ng build gcanvas --configuration=production` — builds the library
   into `dist/gcanvas`.
5. `npm publish` from `dist/gcanvas` using `GITHUB_TOKEN` as the auth token.

`GITHUB_TOKEN` is provisioned automatically by GitHub Actions; the workflow
declares `permissions: packages: write` so it can publish.

---

## 7. After the release

- Create a [GitHub Release](https://github.com/grontis/gcanvas/releases/new)
  from the tag. Write release notes summarizing the public API changes since
  the last tag. `gh release create vX.Y.Z --generate-notes` is a fast start.
- Sanity check by installing into a scratch project:

  ```bash
  mkdir /tmp/gcanvas-smoke && cd /tmp/gcanvas-smoke
  npm init -y
  printf '@grontis:registry=https://npm.pkg.github.com\n' > .npmrc
  npm install @grontis/gcanvas@0.2.0
  ```

  (Requires `NODE_AUTH_TOKEN` or a `~/.npmrc` token with `read:packages`.)

---

## 8. Troubleshooting

### `403 Forbidden` during publish

- Workflow is missing `permissions: packages: write`.
- The package name's scope (`@grontis`) doesn't match the GitHub user/org
  that owns the repository. GitHub Packages rejects publish if the scope
  doesn't match.
- A previously deleted version of the same name+version exists in a
  recoverable state. Restore or delete it from
  <https://github.com/grontis/gcanvas/packages>.

### `409 Conflict` / "Cannot publish over existing version"

- The version in `projects/gcanvas/package.json` already exists in the
  registry. Bump it and re-tag.

### Workflow ran but no package appears

- The workflow ran for a branch push instead of a tag push. The trigger is
  `tags: ['v*']` — branch pushes do not publish. Run
  `git push origin --tags` and confirm the tag is on `origin`.

### Tag exists locally but workflow didn't trigger

- The tag wasn't pushed. `git push origin v0.2.0` (or `--tags` to push all).
- The tag was pushed before the workflow file existed on that commit. Move
  the tag to a commit that includes the workflow:

  ```bash
  git tag -d v0.2.0
  git push --delete origin v0.2.0
  git tag v0.2.0           # at current HEAD
  git push origin --tags
  ```

### Consumer install fails with `401 Unauthorized`

The consumer's `~/.npmrc` is missing a token, or the token lacks
`read:packages`. See [`projects/gcanvas/README.md`](projects/gcanvas/README.md)
for the consumer-side `.npmrc` setup they need.

### Peer-dependency warnings on install

Expected unless the consumer already has the listed peers. The library
ships only `tslib` as a runtime dep — everything else (Angular, CDK, TipTap,
ngx-tiptap) must be installed by the consumer.

### Tests can't find a Chrome binary

Karma needs to know where to find Chrome. On systems without Chrome at the
default path (typical for fresh Linux/cloud dev boxes) you'll see:

```
ERROR [launcher]: No binary for ChromeHeadless browser on your platform.
  Please, set "CHROME_BIN" env variable.
```

Point `CHROME_BIN` at whatever browser binary is installed. Chromium works
as a drop-in:

```bash
# One-off
CHROME_BIN=/usr/bin/chromium-browser ng test gcanvas --no-watch --browsers=ChromeHeadless

# Or persist it for the shell
echo 'export CHROME_BIN=/usr/bin/chromium-browser' >> ~/.bashrc
source ~/.bashrc
```

If neither Chrome nor Chromium is installed:

```bash
# Debian/Ubuntu
sudo apt install chromium-browser   # or: snap install chromium

# macOS
brew install --cask google-chrome
```

CI runners (GitHub Actions `ubuntu-latest`) already have Chrome at the
default path — this only affects local runs.

---

## 9. Yanking / deprecating a version

`npm unpublish` is mostly disabled on registries — prefer `deprecate`:

```bash
npm deprecate @grontis/gcanvas@0.1.5 "Critical bug — use 0.1.6+"
```

For GitHub Packages, you can also delete a package version via the GitHub UI
at <https://github.com/grontis/gcanvas/packages>. Be aware that deleted
versions cannot be re-published with the same version number.

---

## 10. Initial publish notes (v0.1.0)

The first release publishes everything currently exported from
`projects/gcanvas/src/public-api.ts`, including the publish-export pipeline
(`PublishPayload`, `CanvasSerializer`, `ELEMENT_SERIALIZER_TOKEN`,
`IMAGE_RESOLVER_TOKEN`, `BreakpointIframeComponent`). After this release the
public API is considered the reference shape; any change to it follows the
versioning rules in §4.
