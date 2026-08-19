import { Branch, BranchType } from '../models/branch'

export interface IBranchComparisonBase {
  readonly stateBranch: Branch
  readonly comparisonBranch: Branch
}

export function getBranchComparisonBaseRef(branch: Branch): string {
  return branch.upstream ?? branch.name
}

export function resolveBranchComparisonBase(
  branch: Branch,
  upstreamSHA: string | null
): IBranchComparisonBase {
  if (branch.upstream === null) {
    return { stateBranch: branch, comparisonBranch: branch }
  }

  if (upstreamSHA === null) {
    const localBranch = new Branch(
      branch.name,
      null,
      branch.tip,
      branch.type,
      branch.ref
    )
    return { stateBranch: localBranch, comparisonBranch: localBranch }
  }

  const comparisonBranch = new Branch(
    branch.upstream,
    null,
    { sha: upstreamSHA },
    BranchType.Remote,
    `refs/remotes/${branch.upstream}`
  )
  return { stateBranch: branch, comparisonBranch }
}
