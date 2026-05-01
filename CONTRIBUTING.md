# Contributing to EasyContab

## Workflow

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/my-feature`
3. **Make your changes** and commit following conventional commits:
   - `feat: add new feature`
   - `fix: resolve bug`
   - `docs: update documentation`
   - `refactor: code refactoring`
   - `test: add tests`

## Pre-commit Checks

Before pushing, run locally:

```bash
npm run pre-commit
```

This runs:

- ESLint
- TypeScript check
- Unit tests

## Pull Request Process

1. Ensure all checks pass
2. Fill PR template completely
3. Request review
4. After approval, squash and merge

## Code Quality Rules

- Use Prettier for formatting
- Keep TypeScript strict
- Write tests for new features
- Maintain 80% coverage
- No `any` types without justification
- No commented-out code
