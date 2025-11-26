# Changesets Guide

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation automatically.

## How It Works

1. **When you make changes**: Create a changeset file describing your changes
2. **When you're ready to release**: Run `bun run version` to update versions and generate changelog
3. **When publishing**: Run `bun run release` to publish (if applicable)

## Creating a Changeset

When you make changes that should be documented:

```bash
bun run changeset
```

This will prompt you to:
1. Select the type of change (major, minor, patch)
2. Write a summary of the changes

This creates a file in `.changeset/` directory that describes your changes.

## Types of Changes

- **Major**: Breaking changes that require users to update their code
- **Minor**: New features that are backward compatible
- **Patch**: Bug fixes and small improvements

## Example Changeset

After running `bun run changeset`, you might create a file like:

```markdown
---
"hyfe": patch
---

Fixed privacy policy typo and improved table of contents rendering
```

## Versioning

When you're ready to release:

```bash
bun run version
```

This will:
- Read all changeset files
- Update version numbers in `package.json`
- Generate/update `CHANGELOG.md`
- Remove used changeset files

## Release Process

1. Make your changes and commit them
2. Run `bun run changeset` to document changes
3. Commit the changeset file
4. When ready to release, run `bun run version`
5. Review the generated changelog
6. Commit the version bump and changelog
7. Tag the release: `git tag v1.0.1 && git push --tags`

## GitHub Actions

The project includes GitHub Actions workflows:
- **Changeset Validation**: Checks that PRs include changeset files
- **Release**: Automatically creates release PRs and publishes (if configured)

## Best Practices

- Create a changeset for every PR that changes functionality
- Write clear, concise summaries
- Group related changes in a single changeset
- Use patch for bug fixes, minor for features, major for breaking changes
