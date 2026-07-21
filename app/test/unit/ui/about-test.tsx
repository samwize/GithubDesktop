import { strict as assert } from 'assert'
import * as React from 'react'
import { describe, it } from 'node:test'

import { About } from '../../../src/ui/about/about'
import { UpdateStatus } from '../../../src/ui/lib/update-store'
import { render, screen } from '../../helpers/ui/render'

describe('About updates', () => {
  it('shows that automatic updates are disabled without offering an update check', () => {
    render(
      <About
        onDismissed={() => {}}
        applicationName="GitPub"
        applicationVersion="4.0.0"
        applicationBuildNumber="40001"
        applicationArchitecture="arm64"
        onCheckForNonStaggeredUpdates={() => {}}
        onShowAcknowledgements={() => {}}
        onShowTermsAndConditions={() => {}}
        onQuitAndInstall={() => {}}
        updateState={{
          status: UpdateStatus.UpdateNotChecked,
          lastSuccessfulCheck: null,
          isX64ToARM64ImmediateAutoUpdate: false,
          newReleases: null,
          prioritizeUpdate: false,
          prioritizeUpdateInfoUrl: undefined,
        }}
      />
    )

    assert.ok(screen.getByText('Automatic updates are temporarily disabled.'))
    assert.equal(
      screen.queryByRole('button', { name: 'Check for Updates' }),
      null
    )
  })
})
