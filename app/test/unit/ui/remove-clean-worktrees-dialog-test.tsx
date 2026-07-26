import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'
import * as React from 'react'

import { Repository } from '../../../src/models/repository'
import { RemoveCleanWorktreesDialog } from '../../../src/ui/worktrees/remove-clean-worktrees-dialog'
import { fireEvent, render, screen, waitFor } from '../../helpers/ui/render'

let restoreIpcSend: (() => void) | null = null

afterEach(() => {
  restoreIpcSend?.()
  restoreIpcSend = null
})

describe('RemoveCleanWorktreesDialog', () => {
  it('confirms the safe bulk removal behavior before running it', async () => {
    const electron = await import('electron')
    const previousSend = electron.ipcRenderer.send
    electron.ipcRenderer.send = () => {}
    restoreIpcSend = () => {
      electron.ipcRenderer.send = previousSend
    }

    const repository = new Repository('/tmp/repository', 1, null, false)
    let removedRepository: Repository | null = null
    let dismissed = false

    render(
      <RemoveCleanWorktreesDialog
        repository={repository}
        onRemoveCleanWorktrees={async repo => {
          removedRepository = repo
        }}
        onDismissed={() => {
          dismissed = true
        }}
      />
    )

    assert.ok(
      screen.getByText(
        /Local branches will be kept.*ignored files will be deleted/
      )
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove', hidden: true })
    )

    await waitFor(() => assert.equal(dismissed, true))
    assert.equal(removedRepository, repository)
  })
})
