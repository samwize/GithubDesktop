import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import { IBranchComparisonState } from '../../../src/lib/app-state'
import { Branch, BranchType } from '../../../src/models/branch'
import { ImageDiffType } from '../../../src/models/diff'
import { ComputedAction } from '../../../src/models/computed-action'
import { Repository } from '../../../src/models/repository'
import { BranchComparisonDialog } from '../../../src/ui/branch-comparison/branch-comparison-dialog'
import { Dispatcher } from '../../../src/ui/dispatcher'
import { fireEvent, render, screen } from '../../helpers/ui/render'

describe('branch comparison dialog', () => {
  it('shows a local empty state without pull request actions', () => {
    const repository = new Repository('/tmp/repository', 1, null, false)
    const currentBranch = new Branch(
      'feature',
      null,
      { sha: '0123456789abcdef' },
      BranchType.Local,
      'refs/heads/feature'
    )
    const branchComparisonState: IBranchComparisonState = {
      baseBranch: null,
      commitSHAs: null,
      commitSelection: null,
      mergeStatus: null,
    }
    let dismissed = false

    render(
      <BranchComparisonDialog
        repository={repository}
        dispatcher={{} as Dispatcher}
        branchComparisonState={branchComparisonState}
        currentBranch={currentBranch}
        defaultBranch={null}
        baseBranches={[]}
        recentBaseBranches={[]}
        showSideBySideDiff={false}
        hideWhitespaceInDiff={false}
        imageDiffType={ImageDiffType.TwoUp}
        onOpenInExternalEditor={() => {}}
        fileListWidth={{ value: 250, min: 100, max: 700 }}
        onDismissed={() => {
          dismissed = true
        }}
      />
    )

    assert.ok(screen.getByText('Preview Branch Changes'))
    assert.ok(screen.getByText('There are no other branches to compare.'))
    assert.equal(screen.queryByText(/pull request/i), null)

    const closeButtons = screen.getAllByRole('button', {
      name: 'Close',
      hidden: true,
    })
    fireEvent.click(closeButtons[closeButtons.length - 1])
    assert.equal(dismissed, true)
  })

  it('shows no changes when commits have a net-empty file diff', () => {
    const repository = new Repository('/tmp/repository', 1, null, false)
    const currentBranch = new Branch(
      'feature',
      null,
      { sha: '0123456789abcdef' },
      BranchType.Local,
      'refs/heads/feature'
    )
    const baseBranch = new Branch(
      'main',
      null,
      { sha: 'fedcba9876543210' },
      BranchType.Local,
      'refs/heads/main'
    )

    render(
      <BranchComparisonDialog
        repository={repository}
        dispatcher={{} as Dispatcher}
        branchComparisonState={{
          baseBranch,
          commitSHAs: ['0123456789abcdef'],
          commitSelection: {
            shas: ['0123456789abcdef'],
            shasInDiff: ['0123456789abcdef'],
            isContiguous: true,
            changesetData: { files: [], linesAdded: 0, linesDeleted: 0 },
            file: null,
            diff: null,
          },
          mergeStatus: { kind: ComputedAction.Clean },
        }}
        currentBranch={currentBranch}
        defaultBranch={baseBranch}
        baseBranches={[baseBranch]}
        recentBaseBranches={[]}
        showSideBySideDiff={false}
        hideWhitespaceInDiff={false}
        imageDiffType={ImageDiffType.TwoUp}
        onOpenInExternalEditor={() => {}}
        fileListWidth={{ value: 250, min: 100, max: 700 }}
        onDismissed={() => {}}
      />
    )

    assert.ok(screen.getByText('There are no changes.'))
    assert.equal(screen.queryByText('Showing changes from all commits'), null)
  })
})
