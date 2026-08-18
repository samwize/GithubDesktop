import { describe, it } from 'node:test'
import assert from 'node:assert'
import { IAppState, SelectionType } from '../../src/lib/app-state'
import { getMenuState } from '../../src/lib/menu-update'
import { Branch, BranchType } from '../../src/models/branch'
import { Repository } from '../../src/models/repository'
import { Tip, TipState } from '../../src/models/tip'

function createState(tip: Tip): IAppState {
  const repository = new Repository(
    '/tmp/repository-worktree',
    1,
    null,
    false,
    null,
    {},
    false,
    '/tmp/main-repository/.git/worktrees/repository-worktree'
  )

  return {
    currentPopup: null,
    repositories: [repository],
    resizablePaneActive: false,
    selectedState: {
      type: SelectionType.Repository,
      repository,
      state: {
        branchesState: {
          tip,
          defaultBranch: null,
          upstreamDefaultBranch: null,
        },
        changesState: {
          conflictState: null,
          stashEntry: null,
          workingDirectory: { files: [] },
        },
        isPushPullFetchInProgress: false,
        remote: null,
      },
    },
    showWelcomeFlow: false,
    windowState: 'normal',
  } as unknown as IAppState
}

describe('menu update', () => {
  it('enables branch preview for a local worktree without GitHub metadata', () => {
    const branch = new Branch(
      'feature',
      null,
      { sha: '0123456789abcdef' },
      BranchType.Local,
      'refs/heads/feature'
    )
    const state = createState({ kind: TipState.Valid, branch })
    const menuState = getMenuState(state)

    assert.equal(menuState.get('preview-branch-changes')?.enabled, true)
    assert.equal(menuState.get('create-pull-request')?.enabled, false)
  })

  it('disables branch preview for a detached HEAD', () => {
    const state = createState({
      kind: TipState.Detached,
      currentSha: '0123456789abcdef',
    })

    assert.equal(
      getMenuState(state).get('preview-branch-changes')?.enabled,
      false
    )
  })
})
