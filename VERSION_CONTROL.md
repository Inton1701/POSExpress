# Version Control & Release Guide

## Overview

This project uses semantic versioning (SemVer) with automated release management.

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (v1.0.0 → v2.0.0)
- **MINOR:** New features (v1.0.0 → v1.1.0)
- **PATCH:** Bug fixes (v1.0.0 → v1.0.1)

---

## Automated Release Process

### Full Release (Interactive)

```bash
./release.sh
```

**What it does:**
1. ✓ Checks for uncommitted changes
2. ✓ Prompts for version bump type (major/minor/patch)
3. ✓ Updates `VERSION` file and `package.json` files
4. ✓ Prompts for release notes
5. ✓ Creates git tag
6. ✓ Pushes to GitHub
7. ✓ Creates GitHub release (if `gh` CLI installed)
8. ✓ Generates release notes document

**Steps:**
1. Run `./release.sh`
2. Select version bump type (1-5)
3. Enter release notes (press Ctrl+D when done)
4. Confirm push to GitHub
5. Confirm GitHub release creation

---

### Quick Release (One-liner)

For fast patch releases:

```bash
./quick-release.sh "Fixed login bug"
```

**What it does:**
1. ✓ Auto-bumps patch version (1.0.0 → 1.0.1)
2. ✓ Commits with description
3. ✓ Creates and pushes tag
4. ✓ Creates GitHub release

---

## Manual Release Steps

If you prefer manual control:

### 1. Update Version

```bash
# Edit VERSION file
echo "1.2.0" > VERSION

# Update package.json files
cd frontend && npm version 1.2.0 --no-git-tag-version
cd ../backend && npm version 1.2.0 --no-git-tag-version
```

### 2. Commit Changes

```bash
git add VERSION frontend/package.json backend/package.json
git commit -m "chore: bump version to v1.2.0"
```

### 3. Create Tag

```bash
git tag -a v1.2.0 -m "Release v1.2.0 - Description here"
```

### 4. Push to GitHub

```bash
git push origin main
git push origin v1.2.0
```

### 5. Create GitHub Release

**Using GitHub CLI:**
```bash
gh release create v1.2.0 \
    --title "Release v1.2.0" \
    --notes "Release notes here"
```

**Or manually:**
1. Go to: https://github.com/Inton1701/POSExpress/releases/new
2. Choose tag: `v1.2.0`
3. Add title and release notes
4. Attach desktop app builds (.exe, .AppImage)
5. Publish release

---

## GitHub CLI Setup

Install GitHub CLI for automated releases:

**Ubuntu/Debian:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

**Authenticate:**
```bash
gh auth login
```

---

## Release Workflow Examples

### Feature Release (Minor)

```bash
# 1. Develop feature in branch
git checkout -b feature/new-dashboard
# ... make changes ...
git commit -m "feat: add new dashboard"

# 2. Merge to main
git checkout main
git merge feature/new-dashboard

# 3. Create release
./release.sh
# Select: 2) Minor (new features)
# Enter release notes:
## What's New
- New interactive dashboard
- Enhanced reporting features
```

### Bug Fix (Patch)

```bash
# Quick fix and release
git add .
git commit -m "fix: resolve printer connection issue"
./quick-release.sh "Fixed printer connection issue"
```

### Breaking Changes (Major)

```bash
# Major refactor
git add .
git commit -m "refactor!: new authentication system"

./release.sh
# Select: 3) Major (breaking changes)
# Enter detailed migration notes
```

---

## Release Notes Template

```markdown
# Release vX.Y.Z

**Release Date:** YYYY-MM-DD

## 🎉 What's New
- New feature description
- Another feature

## 🐛 Bug Fixes
- Fixed issue #123
- Resolved problem with X

## 🔧 Improvements
- Performance optimization
- UI/UX enhancements

## ⚠️ Breaking Changes
- Changed API endpoint format
- Updated configuration structure

## 📦 Installation

### Docker
\`\`\`bash
docker compose pull
docker compose up -d
\`\`\`

### Native
\`\`\`bash
./auto-update.sh
\`\`\`

## 🔗 Links
- [Full Changelog](https://github.com/Inton1701/POSExpress/compare/vX.Y.Z...vA.B.C)
- [Documentation](https://github.com/Inton1701/POSExpress)
```

---

## Auto-Update Integration

Once a release is published:

1. **Users check for updates** in Admin Settings
2. System calls `/api/system/check-updates`
3. Backend fetches latest release from GitHub
4. If update available, user clicks "Install Update"
5. `auto-update.sh` runs automatically
6. System updates and restarts

**No manual intervention needed!** 🚀

---

## Versioning Best Practices

### DO:
✓ Commit often with descriptive messages
✓ Test before releasing
✓ Write clear release notes
✓ Increment version appropriately
✓ Tag after testing succeeds
✓ Keep VERSION file in sync

### DON'T:
✗ Skip version numbers
✗ Reuse version tags
✗ Release with failing tests
✗ Forget to push tags
✗ Delete tags without republishing

---

## Rollback a Release

If a release has issues:

```bash
# 1. Delete remote tag
git push origin :refs/tags/v1.2.3

# 2. Delete local tag
git tag -d v1.2.3

# 3. Delete GitHub release
gh release delete v1.2.3

# 4. Revert commits if needed
git revert HEAD

# 5. Create new patch release
./quick-release.sh "Reverted v1.2.3 - critical bug fix"
```

---

## Version History Tracking

All releases are documented in `releases/` directory:
```
releases/
  v1.0.0.md
  v1.0.1.md
  v1.1.0.md
```

View all releases:
```bash
ls -la releases/
cat releases/v1.2.0.md
```

---

## CI/CD Integration (Future)

For automated releases on push:

**`.github/workflows/release.yml`:**
```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Release
        run: |
          npm install
          npm run build
          gh release create ${{ github.ref_name }}
```

---

## Questions?

- **How do I know what version I'm running?**
  - Check `VERSION` file
  - Admin Settings → System Updates
  - `cat VERSION` in terminal

- **Can I skip versions?**
  - Not recommended, but possible with custom version

- **What if I forget to push tags?**
  - Run: `git push origin --tags`

- **How do I see all versions?**
  - `git tag -l`
  - GitHub releases page

---

**Remember:** Good version control = Happy users! 🎯s
