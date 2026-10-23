// Windows caps a command line at ~8191 characters. lint-staged interpolates the
// absolute path of every matched file into the command, so a broad change (the
// rbac gating pass touched 123) builds a ~7.4k-char eslint invocation and the
// commit dies with "The command line is too long" before any task runs.
//
// The function form ignores the file list and runs each tool over the project
// instead, so the command length no longer scales with the size of the commit.
// The hook already does a full `tsc -b --force` for the same reason — a whole
// recheck costs seconds here, and it can't be defeated by a large diff.
//
// eslint-config-prettier only switches off conflicting rules, so prettier still
// has to run in its own right; it is scoped to src/ rather than the repo so it
// can't wander into generated output. Anything it reformats outside this commit
// is left as an unstaged working-tree change rather than quietly folded in.
export default {
  '*.{ts,tsx}': () => [
    'eslint . --ext ts,tsx --fix --max-warnings 0',
    'prettier --write "src/**/*.{ts,tsx}"',
  ],
  '*.{css,json,md}': 'prettier --write',
}
