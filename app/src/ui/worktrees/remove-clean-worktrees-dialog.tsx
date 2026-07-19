import * as React from 'react'

import { Repository } from '../../models/repository'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IRemoveCleanWorktreesDialogProps {
  readonly repository: Repository
  readonly askForConfirmationOnWorktreeRemoval: boolean
  readonly onRemoveCleanWorktrees: (repository: Repository) => Promise<void>
  readonly onConfirmWorktreeRemovalChanged: (value: boolean) => void
  readonly onDismissed: () => void
}

interface IRemoveCleanWorktreesDialogState {
  readonly isRemoving: boolean
  readonly confirmWorktreeRemoval: boolean
}

export class RemoveCleanWorktreesDialog extends React.Component<
  IRemoveCleanWorktreesDialogProps,
  IRemoveCleanWorktreesDialogState
> {
  public constructor(props: IRemoveCleanWorktreesDialogProps) {
    super(props)

    this.state = {
      isRemoving: false,
      confirmWorktreeRemoval: props.askForConfirmationOnWorktreeRemoval,
    }
  }

  public render() {
    return (
      <Dialog
        id="remove-clean-worktrees"
        title={__DARWIN__ ? 'Remove Clean Worktrees' : 'Remove clean worktrees'}
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
            Are you sure you want to remove every clean linked worktree that
            isn't open in another window? Worktrees containing tracked,
            untracked, or ignored files will be kept.
          </p>
          <Checkbox
            label="Do not show this message again"
            value={
              this.state.confirmWorktreeRemoval
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onConfirmWorktreeRemovalChanged}
          />
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="Remove" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmWorktreeRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmWorktreeRemoval: value })
  }

  private onSubmit = async () => {
    this.setState({ isRemoving: true })
    this.props.onConfirmWorktreeRemovalChanged(
      this.state.confirmWorktreeRemoval
    )
    await this.props.onRemoveCleanWorktrees(this.props.repository)
    this.props.onDismissed()
  }
}
