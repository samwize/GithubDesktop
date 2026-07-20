import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Branch, BranchType } from '../../../src/models/branch'
import {
  buildCommitGraph,
  getReachableCommitSHAs,
  ICommitGraphCommit,
} from '../../../src/ui/history/commit-graph-layout'

function commit(
  sha: string,
  parentSHAs: ReadonlyArray<string> = []
): ICommitGraphCommit {
  return { sha, parentSHAs }
}

function branch(name: string, sha: string, type = BranchType.Local): Branch {
  const ref =
    type === BranchType.Local ? `refs/heads/${name}` : `refs/remotes/${name}`
  return new Branch(name, null, { sha }, type, ref)
}

describe('commit graph layout', () => {
  it('keeps the current branch in the leftmost lane', () => {
    const currentBranch = branch('feature', 'C')
    const graph = buildCommitGraph(
      [commit('C', ['B']), commit('B', ['A']), commit('A')],
      [],
      currentBranch
    )

    assert.equal(graph.laneCount, 1)
    assert.equal(graph.rows.get('C')?.commitLane, 0)
    assert.equal(graph.rows.get('B')?.commitLane, 0)
    assert.equal(graph.rows.get('A')?.commitLane, 0)
    assert.deepEqual(graph.rows.get('C')?.refs, [
      { name: 'feature', type: BranchType.Local, isCurrent: true },
    ])
  })

  it('draws a second lane from a merge commit back to its shared history', () => {
    const currentBranch = branch('main', 'M')
    const featureBranch = branch('feature', 'F')
    const graph = buildCommitGraph(
      [
        commit('M', ['A', 'F']),
        commit('F', ['B']),
        commit('A', ['B']),
        commit('B'),
      ],
      [featureBranch],
      currentBranch
    )

    const mergeRow = graph.rows.get('M')
    assert.equal(graph.laneCount, 2)
    assert.deepEqual(
      mergeRow?.lines.filter(line => line.from === 'node'),
      [
        {
          fromLane: 0,
          toLane: 0,
          from: 'node',
          to: 'bottom',
          color: 0,
        },
        {
          fromLane: 0,
          toLane: 1,
          from: 'node',
          to: 'bottom',
          color: 1,
        },
      ]
    )
    assert.equal(graph.rows.get('F')?.commitLane, 1)
    assert.deepEqual(graph.rows.get('F')?.refs, [
      { name: 'feature', type: BranchType.Local, isCurrent: false },
    ])
    assert.equal(graph.rows.get('B')?.commitLane, 0)
  })

  it('places additional branch tips to the right of the current history', () => {
    const currentBranch = branch('main', 'A')
    const topicBranch = branch('topic', 'T')
    const graph = buildCommitGraph(
      [commit('A', ['B']), commit('T', ['B']), commit('B')],
      [topicBranch],
      currentBranch
    )

    assert.equal(graph.rows.get('A')?.commitLane, 0)
    assert.equal(graph.rows.get('T')?.commitLane, 1)
    assert.equal(graph.rows.get('B')?.commitLane, 0)
  })

  it('keeps the current branch left when the upstream is ahead', () => {
    const currentBranch = branch('main', 'C')
    const upstream = branch('origin/main', 'R', BranchType.Remote)
    const graph = buildCommitGraph(
      [commit('R', ['C']), commit('C', ['B']), commit('B')],
      [upstream],
      currentBranch
    )

    assert.equal(graph.rows.get('R')?.commitLane, 1)
    assert.equal(graph.rows.get('C')?.commitLane, 0)
    assert.ok(
      graph.rows
        .get('R')
        ?.lines.some(
          line =>
            line.fromLane === 0 &&
            line.toLane === 0 &&
            line.from === 'top' &&
            line.to === 'bottom'
        )
    )
  })

  it('draws divergent local and upstream histories in separate lanes', () => {
    const currentBranch = branch('main', 'C')
    const upstream = branch('origin/main', 'R', BranchType.Remote)
    const graph = buildCommitGraph(
      [commit('R', ['B']), commit('C', ['B']), commit('B')],
      [upstream],
      currentBranch
    )

    assert.equal(graph.rows.get('R')?.commitLane, 1)
    assert.equal(graph.rows.get('C')?.commitLane, 0)
    assert.equal(graph.rows.get('B')?.commitLane, 0)
  })

  it('orders current, local, and remote refs consistently', () => {
    const currentBranch = branch('main', 'A')
    const localBranch = branch('release', 'A')
    const remoteBranch = branch('origin/main', 'A', BranchType.Remote)
    const graph = buildCommitGraph(
      [commit('A')],
      [remoteBranch, localBranch, currentBranch],
      currentBranch
    )

    assert.deepEqual(
      graph.rows.get('A')?.refs.map(ref => ref.name),
      ['main', 'release', 'origin/main']
    )
  })

  it('identifies commits reachable from the current branch', () => {
    const commits = [
      commit('R', ['B']),
      commit('C', ['B']),
      commit('B', ['A']),
      commit('A'),
    ]

    assert.deepEqual([...getReachableCommitSHAs(commits, 'C')], ['C', 'B', 'A'])
  })
})
