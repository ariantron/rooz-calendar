# Releasing

Both packages are versioned and released **together**, and follow semantic versioning from
0.1.0 onward. Other company projects depend on these as packages, so a breaking change has a
real cost to somebody else's build.

## Versioning policy

While the version is `0.x`, treat the **minor** as the breaking-change signal: `0.1.x` is
patch-compatible, `0.2.0` may break. Once the API has settled with real consumers, release
`1.0.0` and use normal semver from there.

What counts as breaking:

- Removing or renaming any export, component or prop.
- Changing the shape of a grid object (`MonthGrid`, `DayCell`, `TimeSlot`, …) — consumers
  render from these directly.
- Changing a callback signature.
- Changing default visual behaviour in a way a consumer would have to compensate for.

What does not:

- Adding an optional prop or a new export.
- Adding a calendar system.
- Fixing a date-conversion bug. A grid that was wrong was never part of the contract — but
  say so plainly in the changelog, because someone may have worked around it.

`@rooz-calendar/ui` declares `@rooz-calendar/core` as a peer dependency with an explicit
semver range. **Bump that range whenever the core's minor changes** — under 0.x, `^0.1.0` does
not match `0.2.0`, so forgetting this breaks installs.

## Checklist

There is no CI, so every step here is manual and none of them are optional.

1. `pnpm install`
2. `pnpm test` — the calendar-core suite must be fully green. Grid generation bugs are the
   whole risk of this project; do not release around a failing date test.
3. `pnpm typecheck`
4. `pnpm build`
5. `pnpm smoke` — packs both packages, installs the tarballs into a throwaway app **outside**
   the workspace with plain `npm`, type-checks against the published `.d.ts`, builds, and
   renders it in a headless browser. This is what catches problems a monorepo build cannot
   see: a missing file in the `files` allowlist, a wrong `exports` path, a `workspace:` range
   leaking into `peerDependencies`, or a stylesheet that is missing utilities.
6. Verify the month grid by hand in the demo app against a real Jalali calendar — at minimum
   a Nowruz boundary and one leap Esfand (1403 or 1408).
7. Update `CHANGELOG.md`, and set the version in both `package.json` files plus the peer range.
8. `git tag vX.Y.Z && git push --tags`
9. `pnpm publish -r --filter "./packages/*" --access public`
10. `pnpm build:site` and deploy `apps/web/dist` to wherever the site is hosted. It is a
    static build; see the website section of the README for the two things a static host
    needs (a `404.html` fallback, and `VITE_BASE` when serving from a subpath).

## Package names

The packages are published under the `@rooz` scope, which is backed by the `rooz` npm
organisation. Scopes are not claimed by publishing — the org has to exist and the publishing
account has to be a member of it, or `npm publish` fails with a 403 that reads like a name
collision. Create it once at <https://npmjs.com/org/create>; it is free for public packages.

Both packages set `publishConfig.access` to `public`, because scoped packages default to
private and would otherwise be rejected on an account without a paid plan.
