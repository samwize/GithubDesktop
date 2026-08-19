import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  getBranchComparisonBaseRef,
  resolveBranchComparisonBase,
} from '../../src/lib/branch-comparison'
import { Branch, BranchType } from '../../src/models/branch'

describe('getBranchComparisonBaseRef', () => {
  it('uses the upstream ref for a tracking branch', () => {
    const branch = new Branch(
      'main',
      'origin/main',
      { sha: 'local-tip' },
      BranchType.Local,
      'refs/heads/main'
    )

    assert.equal(getBranchComparisonBaseRef(branch), 'origin/main')
  })

  it('uses the branch name when it has no upstream', () => {
    const branch = new Branch(
      'topic',
      null,
      { sha: 'topic-tip' },
      BranchType.Local,
      'refs/heads/topic'
    )

    assert.equal(getBranchComparisonBaseRef(branch), 'topic')
  })
})

describe('resolveBranchComparisonBase', () => {
  const branch = new Branch(
    'main',
    'origin/main',
    { sha: 'local-tip' },
    BranchType.Local,
    'refs/heads/main'
  )

  it('uses the remote-tracking branch when it exists', () => {
    const result = resolveBranchComparisonBase(branch, 'upstream-tip')

    assert.equal(result.stateBranch, branch)
    assert.equal(result.comparisonBranch.name, 'origin/main')
    assert.equal(result.comparisonBranch.tip.sha, 'upstream-tip')
  })

  it('falls back consistently when the remote-tracking branch is missing', () => {
    const result = resolveBranchComparisonBase(branch, null)

    assert.equal(result.stateBranch.name, 'main')
    assert.equal(result.stateBranch.upstream, null)
    assert.equal(result.comparisonBranch, result.stateBranch)
    assert.equal(getBranchComparisonBaseRef(result.stateBranch), 'main')
  })
})
