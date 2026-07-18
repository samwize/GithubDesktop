import * as React from 'react'
import { ICommitGraphRow } from './commit-graph-layout'

const RowHeight = 50
const LaneWidth = 14
const HorizontalPadding = 16

interface ICommitGraphProps {
  readonly row: ICommitGraphRow
  readonly laneCount: number
  readonly connectFromTop?: boolean
}

export class CommitGraph extends React.PureComponent<ICommitGraphProps> {
  public render() {
    const width = getCommitGraphWidth(this.props.laneCount)
    const { row } = this.props

    return (
      <svg
        aria-hidden="true"
        className="commit-graph"
        height={RowHeight}
        width={width}
        viewBox={`0 0 ${width} ${RowHeight}`}
      >
        {this.props.connectFromTop === true ? (
          <path
            className={`commit-graph-line commit-graph-color-${row.commitColor}`}
            d={`M ${getLaneX(row.commitLane)} 0 L ${getLaneX(row.commitLane)} ${
              RowHeight / 2
            }`}
          />
        ) : null}
        {row.lines.map((line, index) => (
          <path
            className={`commit-graph-line commit-graph-color-${line.color}`}
            d={getLinePath(line)}
            key={index}
          />
        ))}
        <circle
          className={`commit-graph-node commit-graph-color-${row.commitColor}`}
          cx={getLaneX(row.commitLane)}
          cy={RowHeight / 2}
          r={4}
        />
      </svg>
    )
  }
}

export class WorkingTreeGraph extends React.PureComponent<{
  readonly laneCount: number
}> {
  public render() {
    const width = getCommitGraphWidth(this.props.laneCount)

    return (
      <svg
        aria-hidden="true"
        className="commit-graph working-tree-graph"
        height={RowHeight}
        width={width}
        viewBox={`0 0 ${width} ${RowHeight}`}
      >
        <path
          className="commit-graph-line commit-graph-color-0"
          d={`M ${getLaneX(0)} ${RowHeight / 2} L ${getLaneX(0)} ${RowHeight}`}
        />
        <circle
          className="commit-graph-node commit-graph-color-0"
          cx={getLaneX(0)}
          cy={RowHeight / 2}
          r={4}
        />
      </svg>
    )
  }
}

function getCommitGraphWidth(laneCount: number): number {
  return HorizontalPadding * 2 + Math.max(0, laneCount - 1) * LaneWidth
}

function getLaneX(lane: number): number {
  return HorizontalPadding + lane * LaneWidth
}

function getLinePath(line: ICommitGraphRow['lines'][number]): string {
  const startX = getLaneX(line.fromLane)
  const endX = getLaneX(line.toLane)
  const startY = line.from === 'top' ? 0 : RowHeight / 2
  const endY = line.to === 'node' ? RowHeight / 2 : RowHeight

  if (startX === endX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`
  }

  const middleY = (startY + endY) / 2
  return `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`
}
