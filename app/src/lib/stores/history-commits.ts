export function mergeHistoryCommitBatch(
  commitSHAs: ReadonlyArray<string>,
  historyCommitCount: number,
  batchCommitSHAs: ReadonlyArray<string>,
  tip: string | null
): ReadonlyArray<string> {
  const historyCommitSHAs = commitSHAs.slice(0, historyCommitCount)
  const seen = new Set(historyCommitSHAs)

  for (const sha of batchCommitSHAs) {
    if (!seen.has(sha)) {
      historyCommitSHAs.push(sha)
      seen.add(sha)
    }
  }

  if (tip !== null && !seen.has(tip)) {
    historyCommitSHAs.push(tip)
  }

  return historyCommitSHAs
}
