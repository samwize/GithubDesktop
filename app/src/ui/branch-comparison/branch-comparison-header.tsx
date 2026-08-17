import * as React from 'react'
import { Branch } from '../../models/branch'
import { BranchSelect } from '../branches/branch-select'
import { DialogHeader } from '../dialog/header'
import { Ref } from '../lib/ref'
import { Repository } from '../../models/repository'
import { IChangesetData } from '../../lib/git'

export const BranchComparisonDialogId = 'Dialog_Branch_Comparison'
export const BranchComparisonDialogTitle = __DARWIN__
  ? 'Preview Branch Changes'
  : 'Preview branch changes'

interface IBranchComparisonDialogHeaderProps {
  readonly repository: Repository

  /** The base branch of the comparison. */
  readonly baseBranch: Branch | null

  /** The current branch being compared. */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /** Branches available as the base of the comparison. */
  readonly baseBranches: ReadonlyArray<Branch>

  /** Recently used branches available as the base of the comparison. */
  readonly recentBaseBranches: ReadonlyArray<Branch>

  /** The number of commits in the comparison. */
  readonly commitCount: number

  /** The changeset data associated with the selected commit */
  readonly changesetData: IChangesetData

  /** When the branch selection changes */
  readonly onBranchChange: (branch: Branch) => void

  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the dismissable prop.
   */
  readonly onDismissed?: () => void
}

/** The header for the branch comparison dialog. */
export class BranchComparisonDialogHeader extends React.Component<IBranchComparisonDialogHeaderProps> {
  public constructor(props: IBranchComparisonDialogHeaderProps) {
    super(props)
  }

  public render() {
    const {
      baseBranch,
      currentBranch,
      changesetData,
      defaultBranch,
      baseBranches,
      recentBaseBranches,
      commitCount,
      onBranchChange,
      onDismissed,
    } = this.props
    const { linesAdded, linesDeleted } = changesetData
    const commits = `${commitCount} commit${commitCount > 1 ? 's' : ''}`

    return (
      <DialogHeader
        title={BranchComparisonDialogTitle}
        titleId={BranchComparisonDialogId}
        onCloseButtonClick={onDismissed}
      >
        <div className="break"></div>
        <div className="base-branch-details">
          Compare {commits} from <Ref>{currentBranch.name}</Ref> against{' '}
          <BranchSelect
            repository={this.props.repository}
            branch={baseBranch}
            defaultBranch={defaultBranch}
            currentBranch={currentBranch}
            allBranches={baseBranches}
            recentBranches={recentBaseBranches}
            onChange={onBranchChange}
            noBranchesMessage={<p>There are no other branches to compare.</p>}
          />
          .
        </div>
        <div className="lines-added-deleted">
          <span className="sr-only">Lines changed:</span>
          <span className="lines-added">{linesAdded} added lines</span>
          <span>, </span>
          <span className="lines-deleted">{linesDeleted} removed lines</span>
        </div>
      </DialogHeader>
    )
  }
}
