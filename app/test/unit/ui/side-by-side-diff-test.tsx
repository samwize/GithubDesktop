import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'

import {
  DiffHunk,
  DiffHunkExpansionType,
  DiffHunkHeader,
  DiffLine,
  DiffLineType,
  DiffType,
  ITextDiff,
} from '../../../src/models/diff'
import { Branch, BranchType } from '../../../src/models/branch'
import {
  AppFileStatusKind,
  CommittedFileChange,
} from '../../../src/models/status'
import { SideBySideDiff } from '../../../src/ui/diff/side-by-side-diff'
import { render, screen } from '../../helpers/ui/render'

const createTextDiff = (text: string): ITextDiff => ({
  kind: DiffType.Text,
  text: `@@ -0,0 +1,1 @@\n+${text}`,
  hunks: [
    new DiffHunk(
      new DiffHunkHeader(0, 0, 1, 1),
      [new DiffLine(`+${text}`, DiffLineType.Add, 1, null, 1)],
      1,
      2,
      DiffHunkExpansionType.None
    ),
  ],
  maxLineNumber: 1,
  hasHiddenBidiChars: false,
})

const branch = new Branch(
  'feature',
  null,
  { sha: '0123456789abcdef' },
  BranchType.Local,
  'refs/heads/feature'
)

const createFile = (path: string) =>
  new CommittedFileChange(
    path,
    { kind: AppFileStatusKind.Modified },
    branch.tip.sha,
    'fedcba9876543210'
  )

const renderDiff = (
  file: CommittedFileChange,
  isActiveForGlobalFind: boolean
) => (
  <SideBySideDiff
    file={file}
    diff={createTextDiff(file.path)}
    fileContents={null}
    hideWhitespaceInDiff={false}
    showSideBySideDiff={false}
    showDiffCheckMarks={false}
    renderAllRows={true}
    isActiveForGlobalFind={isActiveForGlobalFind}
    onHideWhitespaceInDiffChanged={() => {}}
  />
)

describe('side-by-side diff', () => {
  it('opens Find for only the active diff in a continuous document', () => {
    render(
      <>
        {renderDiff(createFile('src/one.ts'), true)}
        {renderDiff(createFile('src/two.ts'), false)}
      </>
    )

    document.dispatchEvent(new Event('find-text'))

    assert.equal(screen.getAllByPlaceholderText('Search…').length, 1)
  })
})
