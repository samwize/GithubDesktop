import * as React from 'react'
import { ICommitGraphRow } from './commit-graph-layout'

const DefaultRowHeight = 50
const LaneWidth = 14
const HorizontalPadding = 16
const MaxGraphWidth = 140

interface ICommitGraphProps {
  readonly row: ICommitGraphRow
  readonly laneCount: number
  readonly rowHeight: number
  readonly connectFromTop?: boolean
}

export class CommitGraph extends React.PureComponent<ICommitGraphProps> {
  public render() {
    const width = getCommitGraphWidth(this.props.laneCount)
    const { rowHeight } = this.props
    const { row } = this.props

    return (
      <svg
        aria-hidden="true"
        className="commit-graph"
        height={rowHeight}
        width={width}
        viewBox={`0 0 ${width} ${rowHeight}`}
      >
        {this.props.connectFromTop === true ? (
          <path
            className={`commit-graph-line commit-graph-color-${row.commitColor}`}
            d={`M ${getLaneX(
              row.commitLane,
              this.props.laneCount
            )} 0 L ${getLaneX(row.commitLane, this.props.laneCount)} ${
              rowHeight / 2
            }`}
          />
        ) : null}
        {row.lines.map((line, index) => (
          <path
            className={`commit-graph-line commit-graph-color-${line.color}`}
            d={getLinePath(line, rowHeight, this.props.laneCount)}
            key={index}
          />
        ))}
        <circle
          className={`commit-graph-node commit-graph-color-${row.commitColor}`}
          cx={getLaneX(row.commitLane, this.props.laneCount)}
          cy={rowHeight / 2}
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
        height={DefaultRowHeight}
        width={width}
        viewBox={`0 0 ${width} ${DefaultRowHeight}`}
      >
        <path
          className="commit-graph-line commit-graph-color-0"
          d={`M ${getLaneX(0, this.props.laneCount)} ${
            DefaultRowHeight / 2
          } L ${getLaneX(0, this.props.laneCount)} ${DefaultRowHeight}`}
        />
        <circle
          className="commit-graph-node commit-graph-color-0"
          cx={getLaneX(0, this.props.laneCount)}
          cy={DefaultRowHeight / 2}
          r={4}
        />
      </svg>
    )
  }
}

function getCommitGraphWidth(laneCount: number): number {
  return Math.min(
    MaxGraphWidth,
    HorizontalPadding * 2 + Math.max(0, laneCount - 1) * LaneWidth
  )
}

function getLaneX(lane: number, laneCount: number): number {
  const availableWidth = MaxGraphWidth - HorizontalPadding * 2
  const laneWidth =
    laneCount <= 1
      ? LaneWidth
      : Math.min(LaneWidth, availableWidth / (laneCount - 1))

  return HorizontalPadding + lane * laneWidth
}

function getLinePath(
  line: ICommitGraphRow['lines'][number],
  rowHeight: number,
  laneCount: number
): string {
  const startX = getLaneX(line.fromLane, laneCount)
  const endX = getLaneX(line.toLane, laneCount)
  const startY = line.from === 'top' ? 0 : rowHeight / 2
  const endY = line.to === 'node' ? rowHeight / 2 : rowHeight

  if (startX === endX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`
  }

  const middleY = (startY + endY) / 2
  return `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`
}
