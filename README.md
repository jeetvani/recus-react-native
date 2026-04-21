# recus-rn

Onboarding infrastructure for React Native.

## Installation

```sh
npm install recus-rn
# or
bun add recus-rn
```

### Peer dependencies

```sh
npm install react react-native \
  @react-native-async-storage/async-storage \
  @tanstack/react-query \
  zustand
```

## Usage

Wrap your app with the provider and use the exported hooks:

```tsx
import { RecusAppProvider, useRecus } from "recus-rn";

export default function App() {
  return (
    <RecusAppProvider sdkKey="your-sdk-key">
      {/* your app */}
    </RecusAppProvider>
  );
}
```

See [`src/index.ts`](./src/index.ts) for the full list of exported hooks, components, and types.

## Releasing

Releases are fully automated via GitHub Actions (see [`.github/workflows/publish.yml`](./.github/workflows/publish.yml)).

To publish a new version:

1. Bump the `version` field in `package.json` (e.g. `0.1.0` → `0.1.1`).
2. Commit and push to `main`.
3. The workflow checks the npm registry — if that version isn't published yet, it publishes the package and tags the commit `vX.Y.Z`.

If the version hasn't changed, the workflow no-ops (so normal pushes to `main` don't fail).

### One-time setup

Add an `NPM_TOKEN` repository secret in GitHub:

1. On [npmjs.com](https://www.npmjs.com), create an **Automation** access token with publish rights to `recus-rn`.
2. In the GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `NPM_TOKEN`, value: the token from step 1.

## License

MIT
