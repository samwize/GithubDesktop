# GitPub changelog

## 4.1.0 (Build 40100)

### New

- Preview every committed change between local branches without pushing or
  creating a pull request.
- Review all changed files in one continuous, vertically scrolling document
  while keeping the file list available for anchored navigation.
- Compare unpublished branches and branches checked out in worktrees using
  unified or split diffs.

### Improved

- Give each file a distinct section with a sticky file header and clear visual
  separation.
- Fill the available diff width consistently for added and removed lines.
- Keep added files on the new-file side in split view.

### Fixed

- Compare tracking branches against their remote-tracking base so a stale local
  base does not make unrelated changes appear in the preview.
- Load copied and renamed file diffs correctly when the source file is also
  modified.
