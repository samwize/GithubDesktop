import * as React from 'react'
import * as Path from 'path'
import { IDiff, ImageDiffType } from '../../models/diff'
import { Repository } from '../../models/repository'
import { CommittedFileChange } from '../../models/status'
import { SeamlessDiffSwitcher } from '../diff/seamless-diff-switcher'
import { Dispatcher } from '../dispatcher'
import { openFile } from '../lib/open-file'
import { Resizable } from '../resizable'
import { FileList } from '../history/file-list'
import { IMenuItem, showContextualMenu } from '../../lib/menu-item'
import { pathExists } from '../../lib/path-exists'
import {
  CopyFilePathLabel,
  CopyRelativeFilePathLabel,
  DefaultEditorLabel,
  isSafeFileExtension,
  OpenWithDefaultProgramLabel,
  RevealInFileManagerLabel,
} from '../lib/context-menu'
import { revealInFileManager } from '../../lib/app-shell'
import { clipboard } from 'electron'
import { IConstrainedValue } from '../../lib/app-state'
import { clamp } from '../../lib/clamp'
import { DiffOptions } from '../diff/diff-options'
import { mapStatus } from '../../lib/status'
import { Octicon, iconForStatus } from '../octicons'

interface IBranchComparisonFilesChangedProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher

  /** The file whose diff should be displayed. */
  readonly selectedFile: CommittedFileChange | null

  /** The files changed between the selected branches. */
  readonly files: ReadonlyArray<CommittedFileChange>

  /** Diffs loaded for the changed files, keyed by file ID. */
  readonly diffs: ReadonlyMap<string, IDiff | null>

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean

  /** Whether we should hide whitespace in diff. */
  readonly hideWhitespaceInDiff: boolean

  /** Label for selected external editor */
  readonly externalEditorLabel?: string

  /** Width to use for the files list pane */
  readonly fileListWidth: IConstrainedValue

  /**
   * Callback to open a selected file using the configured external editor
   *
   * @param fullPath The full path to the file on disk
   */
  readonly onOpenInExternalEditor: (fullPath: string) => void
}

interface IBranchComparisonFilesChangedState {
  readonly showSideBySideDiff: boolean
  readonly activeFileId: string | null
}

interface IBranchComparisonDiffSectionProps {
  readonly repository: Repository
  readonly file: CommittedFileChange
  readonly diff: IDiff | null
  readonly imageDiffType: ImageDiffType
  readonly hideWhitespaceInDiff: boolean
  readonly showSideBySideDiff: boolean
  readonly isActive: boolean
  readonly onSectionRef: (fileId: string, element: HTMLElement | null) => void
  readonly onOpenBinaryFile: (fullPath: string) => void
  readonly onChangeImageDiffType: (imageDiffType: ImageDiffType) => void
  readonly onHideWhitespaceInDiffChanged: (
    hideWhitespaceInDiff: boolean
  ) => void
}

class BranchComparisonDiffSection extends React.PureComponent<IBranchComparisonDiffSectionProps> {
  private onSectionRef = (element: HTMLElement | null) => {
    this.props.onSectionRef(this.props.file.id, element)
  }

  public render() {
    const {
      repository,
      file,
      diff,
      imageDiffType,
      hideWhitespaceInDiff,
      showSideBySideDiff,
      isActive,
      onOpenBinaryFile,
      onChangeImageDiffType,
      onHideWhitespaceInDiffChanged,
    } = this.props
    const status = mapStatus(file.status)

    return (
      <section
        className="branch-comparison-diff-section"
        ref={this.onSectionRef}
        data-file-id={file.id}
      >
        <div className="branch-comparison-diff-file-header">
          <span className="file-path">{file.path}</span>
          <Octicon
            symbol={iconForStatus(file.status)}
            className={`status status-${status.toLowerCase()}`}
          />
        </div>
        <div className="branch-comparison-diff-section-body">
          <SeamlessDiffSwitcher
            repository={repository}
            imageDiffType={imageDiffType}
            file={file}
            diff={diff}
            readOnly={true}
            hideWhitespaceInDiff={hideWhitespaceInDiff}
            showSideBySideDiff={showSideBySideDiff}
            showDiffCheckMarks={false}
            renderAllRows={true}
            isActiveForGlobalFind={isActive}
            onOpenBinaryFile={onOpenBinaryFile}
            onChangeImageDiffType={onChangeImageDiffType}
            onHideWhitespaceInDiffChanged={onHideWhitespaceInDiffChanged}
          />
        </div>
      </section>
    )
  }
}

/**
 * A component for viewing the changes between two branches.
 */
export class BranchComparisonFilesChanged extends React.Component<
  IBranchComparisonFilesChangedProps,
  IBranchComparisonFilesChangedState
> {
  private readonly diffListRef = React.createRef<HTMLDivElement>()
  private readonly diffSectionRefs = new Map<string, HTMLElement>()
  private scrollFrame: number | null = null

  public constructor(props: IBranchComparisonFilesChangedProps) {
    super(props)

    this.state = {
      showSideBySideDiff: props.showSideBySideDiff,
      activeFileId: props.selectedFile?.id ?? props.files[0]?.id ?? null,
    }
  }

  public componentDidMount() {
    this.diffListRef.current?.addEventListener(
      'scroll',
      this.onDiffListScroll,
      {
        passive: true,
      }
    )
  }

  public componentDidUpdate(prevProps: IBranchComparisonFilesChangedProps) {
    if (prevProps.files !== this.props.files) {
      const activeFileStillExists = this.props.files.some(
        file => file.id === this.state.activeFileId
      )

      if (!activeFileStillExists) {
        this.setState({
          activeFileId:
            this.props.selectedFile?.id ?? this.props.files[0]?.id ?? null,
        })
      }
    }
  }

  public componentWillUnmount() {
    this.diffListRef.current?.removeEventListener(
      'scroll',
      this.onDiffListScroll
    )

    if (this.scrollFrame !== null) {
      window.cancelAnimationFrame(this.scrollFrame)
    }
  }

  private onOpenFile = (path: string) => {
    const fullPath = Path.join(this.props.repository.path, path)
    this.onOpenBinaryFile(fullPath)
  }

  /**
   * Opens a binary file in an the system-assigned application for
   * said file type.
   */
  private onOpenBinaryFile = (fullPath: string) => {
    openFile(fullPath, this.props.dispatcher)
  }

  /** Called when the user changes the hide whitespace in diffs setting. */
  private onHideWhitespaceInDiffChanged = (hideWhitespaceInDiff: boolean) => {
    const { selectedFile } = this.props
    return this.props.dispatcher.onHideWhitespaceInBranchComparisonDiffChanged(
      hideWhitespaceInDiff,
      this.props.repository,
      selectedFile
    )
  }

  private onShowSideBySideDiffChanged = (showSideBySideDiff: boolean) => {
    this.setState({ showSideBySideDiff })
  }

  private onDiffOptionsOpened = () => {
    this.props.dispatcher.incrementMetric('diffOptionsViewedCount')
  }

  /**
   * Called when the user is viewing an image diff and requests
   * to change the diff presentation mode.
   */
  private onChangeImageDiffType = (imageDiffType: ImageDiffType) => {
    this.props.dispatcher.changeImageDiffType(imageDiffType)
  }

  private onFileListResize = (width: number) => {
    this.props.dispatcher.setBranchComparisonFileListWidth(width)
  }

  private onFileListSizeReset = () => {
    this.props.dispatcher.resetBranchComparisonFileListWidth()
  }

  private onFileContextMenu = async (
    file: CommittedFileChange,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault()

    const { repository } = this.props

    const fullPath = Path.join(repository.path, file.path)
    const fileExistsOnDisk = await pathExists(fullPath)
    if (!fileExistsOnDisk) {
      showContextualMenu([
        {
          label: __DARWIN__
            ? 'File Does Not Exist on Disk'
            : 'File does not exist on disk',
          enabled: false,
        },
      ])
      return
    }

    const { externalEditorLabel, dispatcher } = this.props

    const extension = Path.extname(file.path)
    const isSafeExtension = isSafeFileExtension(extension)
    const openInExternalEditor =
      externalEditorLabel !== undefined
        ? `Open in ${externalEditorLabel}`
        : DefaultEditorLabel

    const items: IMenuItem[] = [
      {
        label: RevealInFileManagerLabel,
        action: () => revealInFileManager(repository, file.path),
        enabled: fileExistsOnDisk,
      },
      {
        label: openInExternalEditor,
        action: () => dispatcher.openInExternalEditor(fullPath),
        enabled: fileExistsOnDisk,
      },
      {
        label: OpenWithDefaultProgramLabel,
        action: () => this.onOpenFile(file.path),
        enabled: isSafeExtension && fileExistsOnDisk,
      },
      { type: 'separator' },
      {
        label: CopyFilePathLabel,
        action: () => clipboard.writeText(fullPath),
      },
      {
        label: CopyRelativeFilePathLabel,
        action: () => clipboard.writeText(Path.normalize(file.path)),
      },
    ]

    showContextualMenu(items)
  }

  private onFileSelected = (file: CommittedFileChange) => {
    this.setState({ activeFileId: file.id })
    this.props.dispatcher.changeBranchComparisonFileSelection(
      this.props.repository,
      file
    )

    const diffList = this.diffListRef.current
    const diffSection = this.diffSectionRefs.get(file.id)
    if (diffList !== null && diffSection !== undefined) {
      const top =
        diffList.scrollTop +
        diffSection.getBoundingClientRect().top -
        diffList.getBoundingClientRect().top
      diffList.scrollTo({ top, behavior: 'auto' })
    }
  }

  private onDiffListScroll = () => {
    if (this.scrollFrame !== null) {
      return
    }

    this.scrollFrame = window.requestAnimationFrame(() => {
      this.scrollFrame = null
      this.updateActiveFileFromScroll()
    })
  }

  private updateActiveFileFromScroll() {
    const diffList = this.diffListRef.current
    if (diffList === null) {
      return
    }

    const listTop = diffList.getBoundingClientRect().top + 1
    let activeFileId = this.props.files[0]?.id ?? null

    for (const file of this.props.files) {
      const section = this.diffSectionRefs.get(file.id)
      if (
        section === undefined ||
        section.getBoundingClientRect().top > listTop
      ) {
        break
      }

      activeFileId = file.id
    }

    if (activeFileId !== this.state.activeFileId) {
      this.setState({ activeFileId })
    }
  }

  private onDiffSectionRef = (fileId: string, element: HTMLElement | null) => {
    if (element === null) {
      this.diffSectionRefs.delete(fileId)
    } else {
      this.diffSectionRefs.set(fileId, element)
    }
  }

  private onRowDoubleClick = (row: number) => {
    const files = this.props.files
    const file = files[row]

    this.props.onOpenInExternalEditor(file.path)
  }

  private renderHeader() {
    const { hideWhitespaceInDiff } = this.props
    const { showSideBySideDiff } = this.state
    return (
      <div className="files-changed-header">
        <div className="commits-displayed">
          Showing changes from all commits
        </div>
        <DiffOptions
          isInteractiveDiff={false}
          hideWhitespaceChanges={hideWhitespaceInDiff}
          onHideWhitespaceChangesChanged={this.onHideWhitespaceInDiffChanged}
          showSideBySideDiff={showSideBySideDiff}
          onShowSideBySideDiffChanged={this.onShowSideBySideDiffChanged}
          onDiffOptionsOpened={this.onDiffOptionsOpened}
        />
      </div>
    )
  }

  private renderFileList() {
    const { files, fileListWidth } = this.props
    const selectedFile =
      files.find(file => file.id === this.state.activeFileId) ?? null

    return (
      <Resizable
        width={fileListWidth.value}
        minimumWidth={fileListWidth.min}
        maximumWidth={fileListWidth.max}
        onResize={this.onFileListResize}
        onReset={this.onFileListSizeReset}
        description="Branch comparison file list"
      >
        <FileList
          files={files}
          onSelectedFileChanged={this.onFileSelected}
          selectedFile={selectedFile}
          availableWidth={clamp(fileListWidth)}
          onContextMenu={this.onFileContextMenu}
          onRowDoubleClick={this.onRowDoubleClick}
        />
      </Resizable>
    )
  }

  private renderDiffs() {
    const { diffs, files, repository, imageDiffType, hideWhitespaceInDiff } =
      this.props
    const { showSideBySideDiff } = this.state

    return (
      <div
        className={
          files.length > 1
            ? 'branch-comparison-diffs has-multiple-files'
            : 'branch-comparison-diffs'
        }
        ref={this.diffListRef}
      >
        {files.map(file => (
          <BranchComparisonDiffSection
            key={file.id}
            repository={repository}
            file={file}
            diff={diffs.get(file.id) ?? null}
            imageDiffType={imageDiffType}
            hideWhitespaceInDiff={hideWhitespaceInDiff}
            showSideBySideDiff={showSideBySideDiff}
            isActive={file.id === this.state.activeFileId}
            onSectionRef={this.onDiffSectionRef}
            onOpenBinaryFile={this.onOpenBinaryFile}
            onChangeImageDiffType={this.onChangeImageDiffType}
            onHideWhitespaceInDiffChanged={this.onHideWhitespaceInDiffChanged}
          />
        ))}
      </div>
    )
  }

  public render() {
    return (
      <div className="branch-comparison-files-changed">
        {this.renderHeader()}
        <div className="files-diff-viewer">
          {this.renderFileList()}
          {this.renderDiffs()}
        </div>
      </div>
    )
  }
}
