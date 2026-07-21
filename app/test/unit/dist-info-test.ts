import { strict as assert } from 'assert'
import { describe, it } from 'node:test'

import { getUpdatesURL } from '../../../script/dist-info'

describe('getUpdatesURL', () => {
  it('does not use the GitHub Desktop update feed for GitPub', () => {
    assert.equal(getUpdatesURL(), undefined)
  })
})
