import { describe, it } from 'node:test'
import assert from 'node:assert'
import { mergeHistoryCommitBatch } from '../../src/lib/stores/history-commits'

describe('mergeHistoryCommitBatch', () => {
  it('keeps a missing tip visible without moving it before descendants', () => {
    const firstBatch = Array.from(
      { length: 100 },
      (_, index) => `remote-${105 - index}`
    )
    const firstPage = mergeHistoryCommitBatch([], 0, firstBatch, 'local-tip')

    assert.deepEqual(firstPage, [...firstBatch, 'local-tip'])

    const secondBatch = [
      'remote-5',
      'remote-4',
      'remote-3',
      'remote-2',
      'remote-1',
      'local-tip',
    ]
    const secondPage = mergeHistoryCommitBatch(
      firstPage,
      firstBatch.length,
      secondBatch,
      'local-tip'
    )

    assert.deepEqual(secondPage, [...firstBatch, ...secondBatch])
  })
})
