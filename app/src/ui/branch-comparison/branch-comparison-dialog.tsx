import * as React from 'react'
import { IConstrainedValue, IBranchComparisonState } from '../../lib/app-state'
import { Branch } from '../../models/branch'
import { ImageDiffType } from '../../models/diff'
import { Repository } from '../../models/repository'
import { DialogFooter, OkCancelButtonGroup, Dialog } from '../dialog'
import { DialogHeader } from '../dialog/header'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import {
  BranchComparisonDialogHeader,
  BranchComparisonDialogId,
  BranchComparisonDialogTitle,
} from './branch-comparison-header'
import { BranchComparisonFilesChanged } from './branch-comparison-files-changed'
import { BranchComparisonMergeStatus } from './branch-comparison-merge-status'
import { ComputedAction } from '../../models/computed-action'

interface IBranchComparisonDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher

  /**
   * The IRepositoryState.branchComparisonState
   */
  readonly branchComparisonState: IBranchComparisonState

  /**
   * The currently checked out branch
   */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /** Branches available as the base of the comparison. */
  readonly baseBranches: ReadonlyArray<Branch>

  /** Recently used branches available as the base of the comparison. */
  readonly recentBaseBranches: ReadonlyArray<Branch>

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean

  /** Whether we should hide whitespace in diff. */
  readonly hideWhitespaceInDiff: boolean

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  /** Label for selected external editor */
  readonly externalEditorLabel?: string

  /**
   * Callback to open a selected file using the configured external editor
   *
   * @param fullPath The full path to the file on disk
   */
  readonly onOpenInExternalEditor: (fullPath: string) => void

  /** Width to use for the files list pane in the files changed view */
  readonly fileListWidth: IConstrainedValue

  /** Called to dismiss the dialog */
  readonly onDismissed: () => void
}

/** The dialog for comparing the current branch with another branch. */
export class BranchComparisonDialog extends React.Component<IBranchComparisonDialogProps> {
  private onBranchChange = (branch: Branch) => {
    const { repository } = this.props
    this.props.dispatcher.updateBranchComparisonBaseBranch(repository, branch)
  }

  private renderHeader() {
    const {
      currentBranch,
      branchComparisonState,
      defaultBranch,
      baseBranches,
      recentBaseBranches,
    } = this.props
    const { baseBranch, commitSelection, commitSHAs } = branchComparisonState
    if (commitSelection === null) {
      return (
        <DialogHeader
          title={BranchComparisonDialogTitle}
          titleId={BranchComparisonDialogId}
          onCloseButtonClick={this.props.onDismissed}
        />
      )
    }

    const { changesetData } = commitSelection

    return (
      <BranchComparisonDialogHeader
        repository={this.props.repository}
        baseBranch={baseBranch}
        currentBranch={currentBranch}
        defaultBranch={defaultBranch}
        baseBranches={baseBranches}
        recentBaseBranches={recentBaseBranches}
        commitCount={commitSHAs?.length ?? 0}
        changesetData={changesetData}
        onBranchChange={this.onBranchChange}
        onDismissed={this.props.onDismissed}
      />
    )
  }

  private renderContent() {
    return (
      <div className="branch-comparison-content">
        {this.renderNoChanges()}
        {this.renderNoDefaultBranch()}
        {this.renderFilesChanged()}
      </div>
    )
  }

  private renderFilesChanged() {
    const {
      dispatcher,
      externalEditorLabel,
      hideWhitespaceInDiff,
      imageDiffType,
      branchComparisonState,
      repository,
      fileListWidth,
    } = this.props
    const { commitSelection } = branchComparisonState
    if (commitSelection === null) {
      // type checking - will render no default branch message
      return
    }

    const { file, changesetData, shas } = commitSelection
    const { files } = changesetData

    if (shas.length === 0 || files.length === 0) {
      return
    }

    return (
      <BranchComparisonFilesChanged
        diffs={branchComparisonState.diffs}
        dispatcher={dispatcher}
        externalEditorLabel={externalEditorLabel}
        fileListWidth={fileListWidth}
        files={files}
        hideWhitespaceInDiff={hideWhitespaceInDiff}
        imageDiffType={imageDiffType}
        selectedFile={file}
        showSideBySideDiff={this.props.showSideBySideDiff}
        repository={repository}
        onOpenInExternalEditor={this.props.onOpenInExternalEditor}
      />
    )
  }

  private renderNoChanges() {
    const { branchComparisonState, currentBranch } = this.props
    const { commitSelection, baseBranch, mergeStatus } = branchComparisonState
    if (commitSelection === null || baseBranch === null) {
      // type checking - will render no default branch message
      return
    }

    if (mergeStatus?.kind === ComputedAction.Loading) {
      return
    }

    const { changesetData } = commitSelection
    if (changesetData.files.length !== 0) {
      return
    }
    const hasMergeBase = mergeStatus?.kind !== ComputedAction.Invalid
    const message = hasMergeBase ? (
      <>
        <Ref>{currentBranch.name}</Ref> has no file changes to merge into{' '}
        <Ref>{baseBranch.name}</Ref>.
      </>
    ) : (
      <>
        <Ref>{baseBranch.name}</Ref> and <Ref>{currentBranch.name}</Ref> are
        entirely different commit histories.
      </>
    )
    return (
      <div className="branch-comparison-message">
        <div>
          <Octicon symbol={octicons.gitCompare} />
          <h3>There are no changes.</h3>
          {message}
        </div>
      </div>
    )
  }

  private renderNoDefaultBranch() {
    const { baseBranch } = this.props.branchComparisonState

    if (baseBranch !== null) {
      return
    }

    return (
      <div className="branch-comparison-message">
        <div>
          <Octicon symbol={octicons.gitCompare} />
          <h3>There are no other branches to compare.</h3>
          Create or fetch another branch, then try again.
        </div>
      </div>
    )
  }

  private renderFooter() {
    const { mergeStatus } = this.props.branchComparisonState

    return (
      <DialogFooter>
        <BranchComparisonMergeStatus mergeStatus={mergeStatus} />
        <OkCancelButtonGroup okButtonText="Close" cancelButtonVisible={false} />
      </DialogFooter>
    )
  }

  public render() {
    return (
      <Dialog
        titleId={BranchComparisonDialogId}
        className="branch-comparison"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderHeader()}
        {this.renderContent()}
        {this.renderFooter()}
      </Dialog>
    )
  }
}
