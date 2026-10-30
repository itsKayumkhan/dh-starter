# Starter sync: keeping projects and dh-starter in step

Every client project is a copy of dh-starter. Without a sync habit, after ten projects there are ten different starters and the same bug gets fixed ten times.

## Separate repositories

The starter repository (`github.com/itsKayumkhan/dh-starter`) and every project repository are separate. A project never has the starter as a git remote, so project code can never be pushed to the starter. Fixes reach the starter only through the porting steps below, made in a clone of the starter.

## Version tracking

- The starter has a version in `STARTER_VERSION` (semver) and a `CHANGELOG.md`.
- `/new-project` writes `STARTER_VERSION` in the new project as `<version> (<starter commit sha>)`, so anyone can see which starter it came from.

## Project to starter (porting a fix)

When a change made inside a project is generic (core in `src/lib`, `src/components/ui`, `src/components/shared`, a module, scripts, configs):

1. Note it in the project task report as **port to starter** with the files and a one-line reason.
2. In the starter repo, make the same change on a branch (`fix/<short-name>`), with tests, without any project-specific names, copy, colors or data.
3. Run `/verify` in the starter, bump `STARTER_VERSION` (patch for fixes, minor for new features or modules, major for breaking changes) and add a `CHANGELOG.md` entry.

Project-specific code (features in `src/features`, content, brand, project modules) never goes back to the starter.

## Starter to project (pulling an update)

1. Read `CHANGELOG.md` entries newer than the project's `STARTER_VERSION`.
2. Apply the relevant changes (copy the changed files from a separate clone of the starter, or fetch it once with `git fetch https://github.com/itsKayumkhan/dh-starter.git main` and cherry-pick, without adding it as a remote), resolve conflicts in favor of the project's own customizations.
3. Run migrations if the entry says so, run `/verify`, and update the project's `STARTER_VERSION`.

Breaking changes must say in the changelog exactly what a project has to change.
