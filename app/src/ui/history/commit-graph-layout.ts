import { Branch, BranchType } from '../../models/branch'

const GraphColorCount = 8

export interface ICommitGraphCommit {
  readonly sha: string
  readonly parentSHAs: ReadonlyArray<string>
}

export interface ICommitGraphRef {
  readonly name: string
  readonly type: BranchType
  readonly isCurrent: boolean
}

export interface ICommitGraphLine {
  readonly fromLane: number
  readonly toLane: number
  readonly from: 'top' | 'node'
  readonly to: 'node' | 'bottom'
  readonly color: number
}

export interface ICommitGraphRow {
  readonly commitLane: number
  readonly commitColor: number
  readonly lines: ReadonlyArray<ICommitGraphLine>
  readonly refs: ReadonlyArray<ICommitGraphRef>
}

export interface ICommitGraph {
  readonly rows: ReadonlyMap<string, ICommitGraphRow>
  readonly laneCount: number
  readonly hash: string
}

interface IActiveLane {
  readonly sha: string
  readonly color: number
}

export function buildCommitGraph(
  commits: ReadonlyArray<ICommitGraphCommit>,
  branches: ReadonlyArray<Branch>,
  currentBranch: Branch | null
): ICommitGraph {
  const commitSHAs = new Set(commits.map(commit => commit.sha))
  const refsBySha = getRefsBySha(branches, currentBranch, commitSHAs)
  const rows = new Map<string, ICommitGraphRow>()
  let activeLanes = new Array<IActiveLane>()
  let laneCount = 1

  for (const commit of commits) {
    const topLanes = activeLanes
    let commitLane = topLanes.findIndex(lane => lane.sha === commit.sha)
    const isNewTip = commitLane === -1

    if (isNewTip) {
      commitLane = topLanes.length
      const color = topLanes.length === 0 ? 0 : takeAvailableColor(topLanes)
      activeLanes = [...topLanes, { sha: commit.sha, color }]
    }

    const lanesWithCommit = activeLanes
    const commitColor = lanesWithCommit[commitLane].color
    const bottomLanes = lanesWithCommit.filter((_, lane) => lane !== commitLane)
    const parentLines = new Array<{ sha: string; color: number }>()

    let insertionLane = Math.min(commitLane, bottomLanes.length)
    commit.parentSHAs.forEach((parentSha, parentIndex) => {
      let parentLane = bottomLanes.findIndex(lane => lane.sha === parentSha)

      if (parentLane === -1) {
        const color =
          parentIndex === 0
            ? commitColor
            : takeAvailableColor(bottomLanes, commitColor)
        parentLane = insertionLane
        bottomLanes.splice(parentLane, 0, { sha: parentSha, color })
        insertionLane++
      }

      parentLines.push({
        sha: parentSha,
        color: parentIndex === 0 ? commitColor : bottomLanes[parentLane].color,
      })
    })

    const lines = lanesWithCommit.flatMap<ICommitGraphLine>(
      (activeLane, lane) =>
        lane === commitLane
          ? []
          : [
              {
                fromLane: lane,
                toLane: bottomLanes.findIndex(
                  item => item.sha === activeLane.sha
                ),
                from: 'top',
                to: 'bottom',
                color: activeLane.color,
              },
            ]
    )

    if (!isNewTip) {
      lines.push({
        fromLane: commitLane,
        toLane: commitLane,
        from: 'top',
        to: 'node',
        color: commitColor,
      })
    }

    for (const parentLine of parentLines) {
      lines.push({
        fromLane: commitLane,
        toLane: bottomLanes.findIndex(lane => lane.sha === parentLine.sha),
        from: 'node',
        to: 'bottom',
        color: parentLine.color,
      })
    }

    laneCount = Math.max(laneCount, lanesWithCommit.length, bottomLanes.length)
    activeLanes = bottomLanes
    rows.set(commit.sha, {
      commitLane,
      commitColor,
      lines,
      refs: refsBySha.get(commit.sha) ?? [],
    })
  }

  return {
    rows,
    laneCount,
    hash: `${commits.map(commit => commit.sha).join(' ')}:${Array.from(
      refsBySha.entries()
    )
      .flatMap(([sha, refs]) =>
        refs.map(
          ref => `${sha}:${ref.name}:${ref.type}:${ref.isCurrent ? '1' : '0'}`
        )
      )
      .join(' ')}`,
  }
}

function takeAvailableColor(
  lanes: ReadonlyArray<IActiveLane>,
  excludedColor?: number
): number {
  const colors = new Set(lanes.map(lane => lane.color))
  if (excludedColor !== undefined) {
    colors.add(excludedColor)
  }

  for (let color = 1; color < GraphColorCount; color++) {
    if (!colors.has(color)) {
      return color
    }
  }

  return lanes.length % GraphColorCount
}

function getRefsBySha(
  branches: ReadonlyArray<Branch>,
  currentBranch: Branch | null,
  commitSHAs: ReadonlySet<string>
): ReadonlyMap<string, ReadonlyArray<ICommitGraphRef>> {
  const refsBySha = new Map<string, ICommitGraphRef[]>()
  const seenRefs = new Set<string>()
  const graphBranches =
    currentBranch === null ? branches : [currentBranch, ...branches]

  for (const branch of graphBranches) {
    if (seenRefs.has(branch.ref) || !commitSHAs.has(branch.tip.sha)) {
      continue
    }

    seenRefs.add(branch.ref)
    const refs = refsBySha.get(branch.tip.sha) ?? []
    refs.push({
      name: branch.name,
      type: branch.type,
      isCurrent: branch.ref === currentBranch?.ref,
    })
    refsBySha.set(branch.tip.sha, refs)
  }

  for (const refs of refsBySha.values()) {
    refs.sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) {
        return a.isCurrent ? -1 : 1
      }

      if (a.type !== b.type) {
        return a.type - b.type
      }

      return a.name.localeCompare(b.name)
    })
  }

  return refsBySha
}
