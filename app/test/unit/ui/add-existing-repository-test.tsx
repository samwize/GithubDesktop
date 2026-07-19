import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'
import { join } from 'path'
import * as React from 'react'

import { git } from '../../../src/lib/git'
import type { Dispatcher } from '../../../src/ui/dispatcher'
import { AddExistingRepository } from '../../../src/ui/add-repository'
import { createTempDirectory } from '../../helpers/temp'
import { fireEvent, render, screen, waitFor } from '../../helpers/ui/render'

let restoreIpcSend: (() => void) | null = null

afterEach(() => {
  restoreIpcSend?.()
  restoreIpcSend = null
})

class TestDispatcher {
  public readonly addedPaths = new Array<ReadonlyArray<string>>()

  public async addRepositories(paths: ReadonlyArray<string>) {
    this.addedPaths.push(paths)
    return []
  }

  public closeFoldout() {}
  public selectRepository() {}
  public recordAddExistingRepository() {}
}

function toDispatcher(dispatcher: TestDispatcher): Dispatcher {
  return dispatcher as unknown as Dispatcher
}

async function stubIpcSend() {
  const electron = await import('electron')
  const previousSend = electron.ipcRenderer.send
  electron.ipcRenderer.send = () => {}
  restoreIpcSend = () => {
    electron.ipcRenderer.send = previousSend
  }
}

describe('AddExistingRepository', () => {
  it('ignores validation results after the path changes', async t => {
    await stubIpcSend()

    const parentPath = await createTempDirectory(t)
    const otherPath = await createTempDirectory(t)
    await git(['init', 'alpha'], parentPath, '')

    const repositoryDialogRef = React.createRef<AddExistingRepository>()

    render(
      <AddExistingRepository
        ref={repositoryDialogRef}
        dispatcher={toDispatcher(new TestDispatcher())}
        path={parentPath}
        onDismissed={() => {}}
      />
    )

    const addRepository = (
      repositoryDialogRef.current as unknown as {
        addRepository: () => Promise<void>
      }
    ).addRepository
    const addPromise = addRepository()

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Local Path', hidden: true }),
      { target: { value: otherPath } }
    )
    await addPromise

    assert.equal(
      repositoryDialogRef.current?.state.isFindingRepositories,
      false
    )
  })

  it('selects immediate child repositories before adding them', async t => {
    await stubIpcSend()

    const parentPath = await createTempDirectory(t)
    await Promise.all([
      git(['init', 'alpha'], parentPath, ''),
      git(['init', 'beta'], parentPath, ''),
    ])

    const dispatcher = new TestDispatcher()
    let dismissed = false

    render(
      <AddExistingRepository
        dispatcher={toDispatcher(dispatcher)}
        path={parentPath}
        onDismissed={() => {
          dismissed = true
        }}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /Add Repository/i, hidden: true })
    )

    await screen.findByText('2 repositories found in this folder')
    const alphaCheckbox = screen.getByRole('checkbox', {
      name: 'alpha',
      hidden: true,
    }) as HTMLInputElement
    const betaCheckbox = screen.getByRole('checkbox', {
      name: 'beta',
      hidden: true,
    }) as HTMLInputElement

    assert.equal(alphaCheckbox.checked, true)
    assert.equal(betaCheckbox.checked, true)

    fireEvent.click(
      screen.getByRole('button', { name: 'Deselect all', hidden: true })
    )
    assert.equal(alphaCheckbox.checked, false)
    assert.equal(betaCheckbox.checked, false)
    assert.equal(
      screen
        .getByRole('button', {
          name: /Add 0 Repositories/i,
          hidden: true,
        })
        .getAttribute('aria-disabled'),
      'true'
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Select all', hidden: true })
    )
    fireEvent.click(betaCheckbox)
    fireEvent.click(
      screen.getByRole('button', {
        name: /Add 1 Repository/i,
        hidden: true,
      })
    )

    await waitFor(() => assert.equal(dismissed, true))
    assert.deepEqual(dispatcher.addedPaths, [[join(parentPath, 'alpha')]])
  })
})
