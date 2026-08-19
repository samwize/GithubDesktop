import { describe, it } from 'node:test'
import assert from 'node:assert'

import { getBranchComparisonBaseRef } from '../../src/lib/branch-comparison'
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
