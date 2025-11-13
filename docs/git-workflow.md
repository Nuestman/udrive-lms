# Git & GitHub Workflow Guide

This guide explains how the team collaborates with Git and GitHub for the SunLMS project. It covers local repository setup, remote management, branch usage, synchronization practices, and common workflows. Follow these steps to stay aligned with the `dev`-first branching strategy.

---

## 1. Prerequisites

- Git 2.40+ installed (`git --version`)
- GitHub account with access to `https://github.com/Nuestman/sunlms`
- SSH key or HTTPS credentials configured for push/pull
- Node.js and project dependencies (see `README.md`)

Optional global Git configuration (run once per developer):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

For Windows PowerShell, the commands above work unchanged. If you use Git Bash or a Unix shell, the syntax is identical.

---

## 2. Cloning and Initial Setup

1. Choose a working directory and clone the repository:

   ```bash
   git clone https://github.com/Nuestman/sunlms.git
   cd sunlms
   ```

2. Fetch all branches and switch to the default working branch:

   ```bash
   git fetch --all
   git checkout dev
   ```

3. Verify tracking status:

   ```bash
   git status
   git branch -vv
   ```

   Ensure `dev` is marked as tracking `origin/dev`.

---

## 3. Remote Configuration

View current remotes:

```bash
git remote -v
```

There should be a single remote named `origin` pointing to `https://github.com/Nuestman/sunlms.git`.

If you need to update the remote URL (for example after forking), run:

```bash
git remote set-url origin NEW_URL
```

Add an upstream remote (optional, if working from a fork):

```bash
git remote add upstream https://github.com/Nuestman/sunlms.git
```

---

## 4. Branching Strategy

- `main`: Stable release branch. No direct commits. Updated only via pull requests from `dev` after review and QA.
- `dev`: Default working branch. All day-to-day development targets this branch.
- Feature branches: Created from `dev` for individual tasks or bug fixes (e.g., `feature/improve-course-list` or `bugfix/fix-sidebar`).

Naming conventions:

- Prefix with `feature/`, `bugfix/`, `chore/`, or `hotfix/`.
- Use kebab-case descriptions reflecting the change.

---

## 5. Creating a Feature Branch

1. Ensure `dev` is up to date:

   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Create and switch to a new branch:

   ```bash
   git checkout -b feature/short-description
   ```

3. Confirm the branch is active (`git branch`) before making changes.

---

## 6. Committing Changes

- Write small, focused commits with descriptive messages.
- Check status frequently:

  ```bash
  git status
  ```

- Stage and commit:

  ```bash
  git add path/to/file.tsx
  git commit -m "Describe what changed"
  ```

For multiple related files:

```bash
git add .
git commit -m "Implement student lesson progress tracking"
```

Use `git commit --amend` only for local changes that have not been pushed.

---

## 7. Synchronizing with Remote

### Pulling Changes

- While on `dev` or your feature branch:

  ```bash
  git pull --ff-only origin dev
  ```

  Using `--ff-only` avoids unintended merge commits. If a fast-forward is impossible, rebase instead:

  ```bash
  git fetch origin
  git rebase origin/dev
  ```

### Rebasing Feature Branches

1. Update local `dev`:

   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Rebase your feature branch onto updated `dev`:

   ```bash
   git checkout feature/short-description
   git rebase dev
   ```

3. Resolve conflicts if prompted, then continue:

   ```bash
   git status
   git add conflicted-file.tsx
   git rebase --continue
   ```

4. Force-push the rebased branch (safe when you are the only contributor on that branch):

   ```bash
   git push --force-with-lease origin feature/short-description
   ```

---

## 8. Pushing and Opening Pull Requests

1. Push your feature branch:

   ```bash
   git push -u origin feature/short-description
   ```

   The `-u` flag sets the upstream for future `git push`/`git pull`.

2. Open a pull request in GitHub targeting `origin/dev`.
3. Request review from the appropriate team members.
4. Address review feedback with additional commits (no need to rebase unless requested).

Once approved and all checks pass:

- Merge the pull request using the “Squash and merge” or “Rebase and merge” option (team preference).
- Delete the feature branch on GitHub to keep the branch list tidy.

---

## 9. Promoting `dev` to `main`

Once `dev` is validated (tests passed, QA sign-off):

1. On GitHub, open a PR from `dev` into `main`.
2. Perform final reviews and approvals.
3. Merge the PR (prefer a merge commit to keep release history clear).
4. Locally, update both branches:

   ```bash
   git checkout main
   git pull origin main
   git checkout dev
   git pull origin dev
   ```

---

## 10. Common Tasks & Commands

| Task                                   | Command(s) |
|----------------------------------------|------------|
| List branches                          | `git branch -a` |
| Delete local branch                    | `git branch -d feature/short-description` |
| Delete remote branch                   | `git push origin --delete feature/short-description` |
| View commit history                    | `git log --oneline --graph --decorate --all` |
| Stash uncommitted changes              | `git stash push -m "WIP: reason"` |
| Restore stashed changes                | `git stash pop` |
| Show remote tracking info              | `git remote show origin` |

All commands are compatible with Windows PowerShell, Git Bash, and Unix shells. Replace forward slashes in branch names with hyphenated names if your tooling does not support them (e.g., Visual Studio).

---

## 11. Best Practices

- Never commit directly to `main`; always go through `dev`.
- Pull frequently to minimize merge conflicts.
- Keep feature branches short-lived (ideally < 1 week).
- Squash or rebase before merging to maintain a clean history.
- Reference issue numbers in commit messages and pull requests (`fixes #123`).
- Run linting/tests before pushing (`npm run lint`, `npm run test` if applicable).
- Document significant workflow changes in `README.md` or the appropriate docs.
- Coordinate with the team before force-pushing shared branches.

---

## 12. Troubleshooting

- **Detached HEAD**: Run `git switch dev` to return to a branch.
- **Merge conflicts**: Use `git status` to list conflicted files, edit to resolve, and run `git add` followed by `git rebase --continue` or `git commit`.
- **Authentication issues**: Configure GitHub CLI (`gh auth login`) or update cached credentials (`git credential-manager clear` on Windows).
- **Remote rejected push**: Pull/rebase the latest changes and try again; if using protected branches, ensure you have required approvals.

For additional help, consult the [official Git documentation](https://git-scm.com/doc) or the SunLMS team.

---

## 13. Quick Reference Checklist

- [ ] Clone repository and check out `dev`
- [ ] Configure Git identity
- [ ] Create feature branch from `dev`
- [ ] Commit changes with clear messages
- [ ] Rebase onto `dev` before final review
- [ ] Push branch and open PR targeting `dev`
- [ ] Merge into `dev` after review and tests
- [ ] Promote `dev` to `main` only after release readiness

Staying consistent with this workflow keeps the codebase stable and makes collaboration smoother for the entire team.


