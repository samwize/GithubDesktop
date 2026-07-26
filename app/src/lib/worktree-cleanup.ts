import * as Path from 'path'

import { IAPIPullRequest } from './api'
import { parseRemote } from './remote-parsing'
import { Branch } from '../models/branch'
import { IRemote } from '../models/remote'
import { WorktreeEntry } from '../models/worktree'

export interface IWorktreePullRequestHead {
  readonly owner: string
  readonly branch: string
}

export function getWorktreePullRequestNumber(
  worktree: WorktreeEntry
): number | null {
  const candidates = [
    Path.basename(worktree.path),
    worktree.branch?.replace(/^refs\/heads\//, ''),
  ]

  for (const candidate of candidates) {
    const match = candidate?.match(/(?:^|\/)pr-(\d+)$/)
    if (match !== undefined && match !== null) {
      return Number(match[1])
    }
  }

  return null
}

export function getWorktreePullRequestHead(
  worktree: WorktreeEntry,
  branches: ReadonlyArray<Branch>,
  remotes: ReadonlyArray<IRemote>
): IWorktreePullRequestHead | null {
  if (worktree.branch === null) {
    return null
  }

  const branch = branches.find(branch => branch.ref === worktree.branch)
  const remoteName = branch?.upstreamRemoteName
  const headBranch = branch?.upstreamWithoutRemote
  if (remoteName == null || headBranch == null) {
    return null
  }

  const remote = remotes.find(remote => remote.name === remoteName)
  if (remote === undefined) {
    return null
  }

  const parsedRemote = parseRemote(remote.url)
  if (parsedRemote === null) {
    return null
  }

  return { owner: parsedRemote.owner, branch: headBranch }
}

export function hasMergedPullRequest(
  pullRequests: ReadonlyArray<
    Pick<IAPIPullRequest, 'state' | 'merged_at' | 'head'>
  >,
  worktreeHead: string
): boolean {
  return (
    pullRequests.length > 0 &&
    pullRequests.every(pullRequest => pullRequest.state === 'closed') &&
    pullRequests.some(
      pullRequest =>
        pullRequest.merged_at != null && pullRequest.head.sha === worktreeHead
    )
  )
}
