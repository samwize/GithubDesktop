import { Branch } from '../models/branch'

export function getBranchComparisonBaseRef(branch: Branch): string {
  return branch.upstream ?? branch.name
}
