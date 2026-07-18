import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import { CommitList } from '../../../src/ui/history/commit-list'
import { fireEvent, render, screen } from '../../helpers/ui/render'

describe('CommitList working tree', () => {
  it('keeps a clean working tree selectable', () => {
    let selections = 0

    render(
      <CommitList
        gitHubRepository={null}
        isLocalRepository={true}
        commitLookup={new Map()}
        commitSHAs={[]}
        selectedSHAs={[]}
        localCommitSHAs={[]}
        emoji={new Map()}
        accounts={[]}
        preferAbsoluteDates={false}
        showCommitGraph={true}
        uncommittedChangesCount={0}
        isWorkingTreeSelected={true}
        onWorkingTreeSelected={() => selections++}
      />
    )

    const workingTree = screen.getByRole('button', {
      name: 'Working tree Clean',
    })

    assert.equal(workingTree.getAttribute('aria-pressed'), 'true')
    fireEvent.click(workingTree)
    assert.equal(selections, 1)
  })

  it('shows the number of uncommitted files', () => {
    render(
      <CommitList
        gitHubRepository={null}
        isLocalRepository={true}
        commitLookup={new Map()}
        commitSHAs={[]}
        selectedSHAs={[]}
        localCommitSHAs={[]}
        emoji={new Map()}
        accounts={[]}
        preferAbsoluteDates={false}
        showCommitGraph={true}
        uncommittedChangesCount={2}
        isWorkingTreeSelected={false}
      />
    )

    assert.ok(
      screen.getByRole('button', {
        name: 'Working tree 2 uncommitted files',
      })
    )
  })
})
