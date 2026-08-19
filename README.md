# GitPub: A fork to support multi-window and more

GitHub Desktop app is good, but its one-window rule is not.

[Multi-window support has been requested since 2017](https://github.com/desktop/desktop/issues/3606).
More than 100 comments later, the team have not yet work on it.
Meanwhile, I have multiple projects running, agents working concurrently, and
exactly zero interest in playing repository musical chairs all day.

So I stopped waiting.

## Features this fork added

1. Open multiple repositories in independent windows.
2. Commits and branch timeline.
3. Preview every committed change between local branches without publishing a
   pull request.
4. Add several local repositories at once by choosing their parent folder.

### 1. One project, one window

Open **File → New Window** or press `Cmd` + `Ctrl` + `N` on macOS (`Ctrl` +
`Alt` + `N` on Windows and Linux). Every window gets its own repository,
branch, history, and working state.

This is real multi-window support inside one app process. Shared background
work stays centralized, so opening 5 windows doesn't mean 5 copies of API
polling, notifications, updates, statistics, Git LFS setup, and repository
indicator refreshes hammering the network.

Repository lists and shared settings stay synchronized. Close the window that
owns the background work and another window takes over automatically.

The result is boring in the best possible way: one project per window, on the
desktop where it belongs.

### 2. One timeline. Zero tabs.

The Changes tab and History tab were never two different things. They were the
present and past of the same repository, split by a switch nobody needed.

GitPub removes the switch. The commit graph is now the default workspace, with
a selectable Working tree connected directly to HEAD.

Click Working tree and the right side becomes the full commit workflow: changed
files, line selection, diffs, commit message, stash and conflict tools, and the
Commit button. Click any commit and the same space shows its summary, files,
and diff.

Your current branch is impossible to miss. Other branches and merges draw
themselves as lines, so you can see where the work came from instead of
reconstructing it in your head.

Tracked remote branches such as `origin/main` appear on the same graph with
ahead and behind status, making divergence visible at a glance.

![GitPub showing the unified working tree and commit timeline for the GithubDesktop repository](./docs/assets/gitpub-unified-timeline.jpg)

No mode switch. No context reset. Just where the repository is now, and exactly
how it got there.

### 3. Review a branch before you publish it

Open **Branch → Preview Branch Changes…** or press `Cmd` + `Option` + `P` on
macOS (`Ctrl` + `Alt` + `P` on Windows and Linux). Choose another branch as the
base and GitPub shows the combined committed diff against your current branch.

The comparison is completely local. It works before you push the branch or
create a pull request, including when the current branch is checked out in a
worktree.

Every changed file appears in one continuous, vertically scrolling document.
The file list stays on the left; click a file and its diff scrolls to the top.
You can switch between unified and split views, hide whitespace changes, and
review new, modified, renamed, and deleted files in the same place.

It is the useful part of a GitHub **Files changed** view, available before
GitHub needs to be involved.

See the [GitPub changelog](./CHANGELOG.md) for fork-specific release notes.

## Run it

This fork doesn't publish installers yet. Follow the upstream
[setup guide](./docs/contributing/setup.md), then build the real app bundle:

```sh
RELEASE_CHANNEL=test node vendor/yarn-1.21.1.js build:prod
open -n dist/GitPub-darwin-$(uname -m)/GitPub.app
```

Automatic updates are temporarily disabled until GitPub publishes its own
signed releases. GitPub does not use GitHub Desktop's update service, so install
new builds manually for now.

The app itself is compiled and signed as a production build: no dev server, no
hot reload, and no inspector stapled to every window.

This is an unofficial fork. It isn't affiliated with or supported by GitHub,
Inc.

I needed windows. Now it has windows.

I wanted the whole repository in one view. Now it has that too.
