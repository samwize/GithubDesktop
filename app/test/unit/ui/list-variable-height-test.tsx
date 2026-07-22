import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import * as React from 'react'

import { List } from '../../../src/ui/lib/list/list'
import { render, waitFor } from '../../helpers/ui/render'

const ListHeight = 200
const ListWidth = 300

class TestListResizeObserver implements ResizeObserver {
  public constructor(private readonly callback: ResizeObserverCallback) {}

  public observe(target: Element) {
    Object.defineProperty(target, 'offsetWidth', {
      configurable: true,
      value: ListWidth,
    })
    Object.defineProperty(target, 'offsetHeight', {
      configurable: true,
      value: ListHeight,
    })

    this.callback(
      [
        {
          target,
          contentRect: {
            x: 0,
            y: 0,
            width: ListWidth,
            height: ListHeight,
            top: 0,
            right: ListWidth,
            bottom: ListHeight,
            left: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this
    )
  }

  public unobserve() {}

  public disconnect() {}
}

let originalResizeObserver: typeof ResizeObserver | undefined

beforeEach(() => {
  originalResizeObserver = globalThis.ResizeObserver
  Object.assign(globalThis, { ResizeObserver: TestListResizeObserver })
  Object.assign(window, { ResizeObserver: TestListResizeObserver })
})

afterEach(() => {
  if (originalResizeObserver === undefined) {
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    Reflect.deleteProperty(window, 'ResizeObserver')
  } else {
    Object.assign(globalThis, { ResizeObserver: originalResizeObserver })
    Object.assign(window, { ResizeObserver: originalResizeObserver })
  }
})

describe('List variable row heights', () => {
  it('recomputes cached heights when row data changes', async () => {
    let rowHeight = 50
    const getRowHeight = () => rowHeight
    const view = (version: number) => (
      <List
        rowCount={1}
        rowHeight={getRowHeight}
        selectedRows={[]}
        rowRenderer={() => <div>Commit</div>}
        invalidationProps={{ version }}
      />
    )
    const { container, rerender } = render(view(1))

    await waitFor(() => {
      assert.equal(
        container.querySelector<HTMLElement>('.list-item')?.style.height,
        '50px'
      )
    })

    rowHeight = 70
    rerender(view(2))

    await waitFor(() => {
      assert.equal(
        container.querySelector<HTMLElement>('.list-item')?.style.height,
        '70px'
      )
    })
  })
})
