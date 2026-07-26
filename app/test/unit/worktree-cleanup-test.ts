import assert from 'node:assert'
import { describe, it } from 'node:test'

import { Branch, BranchType } from '../../src/models/branch'
import { WorktreeEntry } from '../../src/models/worktree'
import {
  getWorktreePullRequestHead,
  getWorktreePullRequestNumber,
  hasMergedPullRequest,
} from '../../src/lib/worktree-cleanup'

describe('worktree cleanup', () => {
  it('resolves the pull request head from the worktree branch upstream', () => {
    const worktree: WorktreeEntry = {
      path: '/tmp/pr-1',
      head: 'abc',
      branch: 'refs/heads/review/pr-1',
      isDetached: false,
      type: 'linked',
      isLocked: false,
      isPrunable: false,
    }
    const branch = new Branch(
      'review/pr-1',
      'origin/feature',
      { sha: 'abc' },
      BranchType.Local,
      'refs/heads/review/pr-1'
    )

    assert.deepStrictEqual(
      getWorktreePullRequestHead(
        worktree,
        [branch],
        [{ name: 'origin', url: 'https://github.com/owner/repository.git' }]
      ),
      { owner: 'owner', branch: 'feature' }
    )
  })

  it('requires a merged pull request and no open reuse of the branch', () => {
    assert.equal(
      hasMergedPullRequest([{ state: 'closed', merged_at: '2026-07-01' }]),
      true
    )
    assert.equal(
      hasMergedPullRequest([{ state: 'closed', merged_at: null }]),
      false
    )
    assert.equal(
      hasMergedPullRequest([
        { state: 'closed', merged_at: '2026-07-01' },
        { state: 'open', merged_at: null },
      ]),
      false
    )
  })

  it('gets the pull request number from the worktree path or branch', () => {
    const worktree: WorktreeEntry = {
      path: '/tmp/pr-7142',
      head: 'abc',
      branch: 'refs/heads/feature',
      isDetached: false,
      type: 'linked',
      isLocked: false,
      isPrunable: false,
    }

    assert.equal(getWorktreePullRequestNumber(worktree), 7142)
    assert.equal(
      getWorktreePullRequestNumber({
        ...worktree,
        path: '/tmp/feature',
        branch: 'refs/heads/review/pr-7170',
      }),
      7170
    )
  })
})
