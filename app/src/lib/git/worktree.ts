import * as Path from 'path'
import type { Repository } from '../../models/repository'
import type { WorktreeEntry, WorktreeType } from '../../models/worktree'
import { git } from './core'

export function parseWorktreePorcelainOutput(
  stdout: string
): ReadonlyArray<WorktreeEntry> {
  if (stdout.trim().length === 0) {
    return []
  }

  // With -z, worktree blocks are separated by double NUL and fields within
  // a block are separated by single NUL
  const blocks = stdout.replace(/\0$/, '').split('\0\0')
  const entries: WorktreeEntry[] = []

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split('\0')
    let path = ''
    let head = ''
    let branch: string | null = null
    let isDetached = false
    let isLocked = false
    let isPrunable = false

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        // Git for Windows will output paths using forward slashes, i.e.
        // c:/Users/niik/... but repositories added in Desktop always pass
        // through getRepositoryType which uses path.resolve to deduce the
        // absolute top level directory and that will normalize paths as well
        // so by normalizing here we can be more confident about comparing paths
        path = Path.normalize(line.substring('worktree '.length))
      } else if (line.startsWith('HEAD ')) {
        head = line.substring('HEAD '.length)
      } else if (line.startsWith('branch ')) {
        branch = line.substring('branch '.length)
      } else if (line === 'detached') {
        isDetached = true
      } else if (line === 'locked' || line.startsWith('locked ')) {
        isLocked = true
      } else if (line === 'prunable' || line.startsWith('prunable ')) {
        isPrunable = true
      }
    }

    const type: WorktreeType = i === 0 ? 'main' : 'linked'
    entries.push({ path, head, branch, isDetached, type, isLocked, isPrunable })
  }

  return entries
}

export async function listWorktrees(
  repositoryOrPath: Repository | string
): Promise<ReadonlyArray<WorktreeEntry>> {
  const result = await git(
    ['worktree', 'list', '--porcelain', '-z'],
    typeof repositoryOrPath === 'string'
      ? repositoryOrPath
      : repositoryOrPath.path,
    'listWorktrees'
  )

  return parseWorktreePorcelainOutput(result.stdout)
}

export async function listWorktreesFromGitDir(
  gitDir: string
): Promise<ReadonlyArray<WorktreeEntry>> {
  const result = await git(
    ['--git-dir', gitDir, 'worktree', 'list', '--porcelain', '-z'],
    gitDir,
    'listWorktreesFromGitDir'
  )

  return parseWorktreePorcelainOutput(result.stdout)
}

export async function addWorktree(
  repository: Repository,
  path: string,
  options: {
    /** Branch name used with -b (create new branch) */
    readonly createBranch?: string
    /** Commit-ish to check out (branch name, ref, or SHA) */
    readonly commitish?: string
  } = {}
): Promise<void> {
  const args = ['worktree', 'add']

  if (options.createBranch) {
    args.push('-b', options.createBranch)
  }

  args.push(path)

  if (options.commitish) {
    args.push(options.commitish)
  }

  await git(args, repository.path, 'addWorktree')
}

export async function removeWorktree(
  repositoryPath: string,
  worktreePath: string,
  force: boolean = false
): Promise<void> {
  const args = ['worktree', 'remove']
  if (force) {
    args.push('--force')
  }
  args.push(worktreePath)

  await git(args, repositoryPath, 'removeWorktree')
}

export async function removeIgnoredWorktreeFiles(
  worktreePath: string
): Promise<void> {
  await git(
    ['clean', '-d', '-f', '-X'],
    worktreePath,
    'removeIgnoredWorktreeFiles'
  )
}

export async function isWorktreeClean(worktreePath: string): Promise<boolean> {
  return (await getWorktreeRemovalStatus(worktreePath)) === 'clean'
}

export type WorktreeRemovalStatus = 'clean' | 'ignored-only' | 'dirty'

export async function getWorktreeRemovalStatus(
  worktreePath: string
): Promise<WorktreeRemovalStatus> {
  const result = await git(
    [
      '--no-optional-locks',
      'status',
      '--porcelain',
      '-z',
      '--untracked-files=normal',
    ],
    worktreePath,
    'getWorktreeRemovalStatus'
  )

  if (result.stdout.length > 0) {
    return 'dirty'
  }

  const resultWithIgnoredFiles = await git(
    [
      '--no-optional-locks',
      'status',
      '--porcelain',
      '-z',
      '--untracked-files=normal',
      '--ignored=matching',
    ],
    worktreePath,
    'getWorktreeRemovalStatusWithIgnoredFiles'
  )

  return resultWithIgnoredFiles.stdout.length === 0 ? 'clean' : 'ignored-only'
}

export async function isPullRequestMergedIntoBranch(
  repositoryPath: string,
  branchRef: string,
  pullRequestNumber: number
): Promise<boolean> {
  const result = await git(
    [
      'log',
      '-1',
      '--format=%H',
      '--fixed-strings',
      `--grep=(#${pullRequestNumber})`,
      branchRef,
    ],
    repositoryPath,
    'isPullRequestMergedIntoBranch'
  )

  return result.stdout.trim().length > 0
}

export async function getPullRequestHeadSha(
  repositoryPath: string,
  remote: string,
  pullRequestNumber: number
): Promise<string | null> {
  const ref = `refs/pull/${pullRequestNumber}/head`
  const result = await git(
    ['ls-remote', remote, ref],
    repositoryPath,
    'getPullRequestHeadSha'
  )
  const [sha] = result.stdout.trim().split(/\s+/, 1)

  return sha || null
}

export async function moveWorktree(
  repository: Repository,
  oldPath: string,
  newPath: string
): Promise<void> {
  await git(
    ['worktree', 'move', oldPath, newPath],
    repository.path,
    'moveWorktree'
  )
}
