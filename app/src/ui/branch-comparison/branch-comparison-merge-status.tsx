import * as React from 'react'
import { assertNever } from '../../lib/fatal-error'
import { ComputedAction } from '../../models/computed-action'
import { MergeTreeResult } from '../../models/merge'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IBranchComparisonMergeStatusProps {
  /** The result of merging the current branch into the base branch. */
  readonly mergeStatus: MergeTreeResult | null
}

/** Displays whether the compared branches can be merged automatically. */
export class BranchComparisonMergeStatus extends React.Component<IBranchComparisonMergeStatusProps> {
  private getMergeStatusDescription = () => {
    const { mergeStatus } = this.props
    if (mergeStatus === null) {
      return ''
    }

    const { kind } = mergeStatus
    switch (kind) {
      case ComputedAction.Loading:
        return (
          <span className="branch-comparison-merge-status-loading">
            <strong>Loading branch comparison&hellip;</strong>
          </span>
        )
      case ComputedAction.Invalid:
        return (
          <span className="branch-comparison-merge-status-invalid">
            <strong>Unable to compare branches.</strong> These branches have
            unrelated histories.
          </span>
        )
      case ComputedAction.Clean:
        return (
          <span className="branch-comparison-merge-status-clean">
            <strong>
              <Octicon symbol={octicons.check} /> Able to merge.
            </strong>{' '}
            These branches can be automatically merged.
          </span>
        )
      case ComputedAction.Conflicts:
        return (
          <span className="branch-comparison-merge-status-conflicts">
            <strong>
              <Octicon symbol={octicons.x} /> Can't automatically merge.
            </strong>{' '}
            These branches have merge conflicts.
          </span>
        )
      default:
        return assertNever(kind, `Unknown merge status kind of ${kind}.`)
    }
  }

  public render() {
    return (
      <div className="branch-comparison-merge-status">
        {this.getMergeStatusDescription()}
      </div>
    )
  }
}
