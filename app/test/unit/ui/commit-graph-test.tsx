import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import { CommitGraph } from '../../../src/ui/history/commit-graph'
import { ICommitGraphRow } from '../../../src/ui/history/commit-graph-layout'
import { render } from '../../helpers/ui/render'

describe('CommitGraph', () => {
  it('caps dense graphs at 140 pixels', () => {
    const row: ICommitGraphRow = {
      commitLane: 19,
      commitColor: 0,
      lines: [],
      refs: [],
    }
    const { container } = render(
      <CommitGraph row={row} laneCount={20} rowHeight={50} />
    )
    const graph = container.querySelector('svg')
    const node = container.querySelector('circle')

    assert.equal(graph?.getAttribute('width'), '140')
    assert.equal(node?.getAttribute('cx'), '124')
  })

  it('keeps natural spacing for compact graphs', () => {
    const row: ICommitGraphRow = {
      commitLane: 2,
      commitColor: 0,
      lines: [],
      refs: [],
    }
    const { container } = render(
      <CommitGraph row={row} laneCount={3} rowHeight={50} />
    )
    const graph = container.querySelector('svg')
    const node = container.querySelector('circle')

    assert.equal(graph?.getAttribute('width'), '60')
    assert.equal(node?.getAttribute('cx'), '44')
  })
})
