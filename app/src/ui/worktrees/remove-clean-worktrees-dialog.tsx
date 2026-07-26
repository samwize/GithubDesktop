import * as React from 'react'

import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IRemoveCleanWorktreesDialogProps {
  readonly repository: Repository
  readonly onRemoveCleanWorktrees: (repository: Repository) => Promise<void>
  readonly onDismissed: () => void
}

interface IRemoveCleanWorktreesDialogState {
  readonly isRemoving: boolean
}

export class RemoveCleanWorktreesDialog extends React.Component<
  IRemoveCleanWorktreesDialogProps,
  IRemoveCleanWorktreesDialogState
> {
  public constructor(props: IRemoveCleanWorktreesDialogProps) {
    super(props)

    this.state = {
      isRemoving: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="remove-clean-worktrees"
        title={
          __DARWIN__ ? 'Remove Merged Worktrees' : 'Remove merged worktrees'
        }
        type="warning"
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isRemoving}
        loading={this.state.isRemoving}
        role="alertdialog"
        ariaDescribedBy="remove-clean-worktrees-confirmation"
      >
        <DialogContent>
          <p id="remove-clean-worktrees-confirmation">
            Remove linked worktrees for merged pull requests that aren't open in
            another window? Local branches will be kept. Worktrees containing
            tracked or untracked files will be kept, but ignored files will be
            deleted.
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="Remove" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    this.setState({ isRemoving: true })
    await this.props.onRemoveCleanWorktrees(this.props.repository)
    this.props.onDismissed()
  }
}
