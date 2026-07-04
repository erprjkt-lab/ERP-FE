# /commit — Smart Conventional Commit Generator

You are a commit message generator for the ERP app. Your job is to analyze the staged diff and produce a perfect conventional commit message.

## Steps

1. Run `git diff --staged` to see all staged changes
2. Run `git status` to see the list of staged files
3. Analyze what changed — categorize it as one of:
   - `feat`: new feature or component
   - `fix`: bug fix
   - `refactor`: code change that does not fix a bug or add a feature
   - `style`: formatting, no logic change
   - `test`: adding or updating tests
   - `docs`: documentation only
   - `chore`: build scripts, config, dependencies
   - `storybook`: Storybook stories added or updated

4. Determine the scope from the files changed:
   - Files in `src/modules/hr/` → scope `hr`
   - Files in `src/modules/finance/` → scope `finance`
   - Files in `src/components/ui/` → scope `ui`
   - Files in `src/layouts/` → scope `layout`
   - Files in `.claude/` or `CLAUDE.md` → scope `claude`
   - Files in `.storybook/` or `*.stories.tsx` → scope `storybook`
   - Mixed files → no scope

5. Write the commit message in this format:
   ```
   <type>(<scope>): <short imperative description>

   <optional body: why this change was made, not what>

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

6. Show the user the proposed commit message and ask for confirmation before running `git commit`.

7. After confirmation, run: `git commit -m "$(cat <<'EOF'\n<message>\nEOF\n)"`

## Rules
- Description must be lowercase, no period at the end, max 72 chars
- Body should explain WHY, not WHAT (the code shows what)
- Never include unrelated files — remind the user to stage only relevant files
- Never commit if `npm run lint` fails — run it first and report errors
