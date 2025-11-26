# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation.

## Quick Start

### 1. Create a Changeset

When you make changes that should be documented:

```bash
bun run changeset
```

This will:
- Prompt you to select the change type (major/minor/patch)
- Ask you to write a summary
- Create a markdown file in `.changeset/` directory

### 2. Version and Generate Changelog

When ready to release:

```bash
bun run version
```

This will:
- Read all changeset files
- Update `package.json` version
- Generate/update `CHANGELOG.md`
- Remove used changeset files

### 3. Commit Changes

```bash
git add .
git commit -m "chore: version packages"
git push
```

## Change Types

- **Major** (`major`): Breaking changes
- **Minor** (`minor`): New features (backward compatible)
- **Patch** (`patch`): Bug fixes and small improvements

## Example Workflow

```bash
# 1. Make your changes
git checkout -b feature/new-feature
# ... make changes ...

# 2. Create changeset
bun run changeset
# Select: minor
# Write: "Added new feature X"

# 3. Commit everything
git add .
git commit -m "feat: add new feature X"
git push

# 4. When ready to release
bun run version
git add .
git commit -m "chore: version packages"
git tag v1.1.0
git push --tags
```

## Files

- `.changeset/*.md` - Individual changeset files (auto-generated)
- `CHANGELOG.md` - Generated changelog (auto-updated)
- `.changeset/config.json` - Changesets configuration

For more details, see [docs/CHANGESETS.md](../../docs/CHANGESETS.md)
