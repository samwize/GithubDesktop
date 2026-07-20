import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import { Commit } from '../../../src/models/commit'
import { CommitIdentity } from '../../../src/models/commit-identity'
import { Branch, BranchType } from '../../../src/models/branch'
import { buildCommitGraph } from '../../../src/ui/history/commit-graph-layout'
import { CommitList } from '../../../src/ui/history/commit-list'
import { CommitListItem } from '../../../src/ui/history/commit-list-item'
import { render, screen } from '../../helpers/ui/render'

describe('CommitList upstream', () => {
  it('shows the tracked remote ref and synchronization status', () => {
    const identity = new CommitIdentity('Test', 'test@example.com', new Date())
    const commit = new Commit(
      'A',
      'A',
      'Initial commit',
      '',
      identity,
      identity,
      [],
      [],
      []
    )
    const currentBranch = new Branch(
      'main',
      'origin/main',
      { sha: commit.sha },
      BranchType.Local,
      'refs/heads/main'
    )
    const upstream = new Branch(
      'origin/main',
      null,
      { sha: commit.sha },
      BranchType.Remote,
      'refs/remotes/origin/main'
    )
    const graph = buildCommitGraph([commit], [upstream], currentBranch)

    const view = (ahead: number, behind: number) => (
      <CommitListItem
        gitHubRepository={null}
        commit={commit}
        selectedCommits={[]}
        emoji={new Map()}
        accounts={[]}
        preferAbsoluteDates={false}
        showUnpushedIndicator={false}
        commitGraphRow={graph.rows.get(commit.sha)}
        commitGraphLaneCount={graph.laneCount}
        currentBranchUpstream={currentBranch.upstream}
        aheadBehind={{ ahead, behind }}
      />
    )
    const { rerender } = render(view(0, 0))

    assert.ok(screen.getByText('main'))
    assert.ok(screen.getByText('origin/main'))
    assert.ok(screen.getByText('tracks origin/main · up to date'))

    rerender(view(2, 3))
    assert.ok(screen.getByText('tracks origin/main · 2 ahead · 3 behind'))
  })

  it('keeps upstream-only commits out of history rewrite operations', () => {
    const identity = new CommitIdentity('Test', 'test@example.com', new Date())
    const remoteCommit = new Commit(
      'R',
      'R',
      'Remote commit',
      '',
      identity,
      identity,
      ['B'],
      [],
      []
    )
    const localCommit = new Commit(
      'C',
      'C',
      'Local commit',
      '',
      identity,
      identity,
      ['B'],
      [],
      []
    )
    const baseCommit = new Commit(
      'B',
      'B',
      'Base commit',
      '',
      identity,
      identity,
      [],
      [],
      []
    )
    const currentBranch = new Branch(
      'main',
      'origin/main',
      { sha: localCommit.sha },
      BranchType.Local,
      'refs/heads/main'
    )
    const commitLookup = new Map(
      [remoteCommit, localCommit, baseCommit].map(commit => [
        commit.sha,
        commit,
      ])
    )
    const list = new CommitList({
      gitHubRepository: null,
      isLocalRepository: false,
      commitLookup,
      commitSHAs: [remoteCommit.sha, localCommit.sha, baseCommit.sha],
      selectedSHAs: [],
      localCommitSHAs: [localCommit.sha],
      emoji: new Map(),
      accounts: [],
      preferAbsoluteDates: false,
      showCommitGraph: true,
      currentBranch,
      branches: [],
      isMultiCommitOperationInProgress: false,
      disableReordering: false,
      disableSquashing: false,
    })

    const renderCommit = (
      list as unknown as {
        readonly renderCommit: (row: number) => React.ReactElement
      }
    ).renderCommit.bind(list)
    const remoteItem = renderCommit(0)
    const localItem = renderCommit(1)

    assert.equal(remoteItem.props.isDraggable, false)
    assert.equal(remoteItem.props.disableSquashing, true)
    assert.equal(localItem.props.isDraggable, true)
    assert.equal(localItem.props.disableSquashing, false)
  })
})
