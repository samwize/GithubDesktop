import * as React from 'react'
import * as Path from 'path'
import { Dispatcher } from '../dispatcher'
import { addSafeDirectory, getRepositoryType } from '../../lib/git'
import { Button } from '../lib/button'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { PopupType } from '../../models/popup'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { FoldoutType } from '../../lib/app-state'

import untildify from 'untildify'
import { showOpenDialog } from '../main-process-proxy'
import { Ref } from '../lib/ref'
import { InputError } from '../lib/input-description/input-error'
import { IAccessibleMessage } from '../../models/accessible-message'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import {
  findRepositoriesInDirectory,
  IFoundRepository,
} from './find-repositories-in-directory'

interface IAddExistingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void

  /** An optional path to prefill the path text box with.
   * Defaults to the empty string if not defined.
   */
  readonly path?: string
}

interface IAddExistingRepositoryState {
  readonly path: string

  /**
   * Indicates whether or not to render a warning message about the entered path
   * not containing a valid Git repository. This value differs from `isGitRepository` in that it holds
   * its value when the path changes until we've gotten a definitive answer from the asynchronous
   * method that the path is, or isn't, a valid repository path. Separating the two means that
   * we don't toggle visibility of the warning message until it's really necessary, preventing
   * flickering for our users as they type in a path.
   */
  readonly showNonGitRepositoryWarning: boolean
  readonly isRepositoryBare: boolean
  readonly isRepositoryUnsafe: boolean
  readonly repositoryUnsafePath?: string
  readonly isTrustingRepository: boolean
  readonly isFindingRepositories: boolean
  readonly foundRepositories: ReadonlyArray<IFoundRepository>
  readonly selectedRepositoryPaths: ReadonlySet<string>
}

interface IFoundRepositoryCheckboxProps {
  readonly repository: IFoundRepository
  readonly checked: boolean
  readonly onSelectionChanged: (path: string, checked: boolean) => void
}

class FoundRepositoryCheckbox extends React.Component<IFoundRepositoryCheckboxProps> {
  private onChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onSelectionChanged(
      this.props.repository.path,
      event.currentTarget.checked
    )
  }

  public render() {
    return (
      <Checkbox
        label={this.props.repository.name}
        value={this.props.checked ? CheckboxValue.On : CheckboxValue.Off}
        onChange={this.onChange}
      />
    )
  }
}

/** The component for adding an existing local repository. */
export class AddExistingRepository extends React.Component<
  IAddExistingRepositoryProps,
  IAddExistingRepositoryState
> {
  private pathTextBoxRef = React.createRef<TextBox>()

  public constructor(props: IAddExistingRepositoryProps) {
    super(props)

    const path = this.props.path ? this.props.path : ''

    this.state = {
      path,
      showNonGitRepositoryWarning: false,
      isRepositoryBare: false,
      isRepositoryUnsafe: false,
      isTrustingRepository: false,
      isFindingRepositories: false,
      foundRepositories: [],
      selectedRepositoryPaths: new Set(),
    }
  }

  private onTrustDirectory = async () => {
    this.setState({ isTrustingRepository: true })
    const { repositoryUnsafePath, path } = this.state
    if (repositoryUnsafePath) {
      await addSafeDirectory(repositoryUnsafePath)
    }
    await this.validatePath(path)
    this.setState({ isTrustingRepository: false })
  }

  private updatePath(path: string) {
    this.setState({
      path,
      isRepositoryBare: false,
      isRepositoryUnsafe: false,
      showNonGitRepositoryWarning: false,
      repositoryUnsafePath: undefined,
      foundRepositories: [],
      selectedRepositoryPaths: new Set(),
    })
  }

  private async validatePath(path: string) {
    if (path.length === 0) {
      this.setState({
        isRepositoryBare: false,
        isRepositoryUnsafe: false,
        showNonGitRepositoryWarning: false,
        repositoryUnsafePath: undefined,
      })
      return { kind: 'missing' } as const
    }

    const type = await getRepositoryType(path)

    const isRepository = type.kind !== 'missing' && type.kind !== 'unsafe'
    const isRepositoryUnsafe = type.kind === 'unsafe'
    const isRepositoryBare = type.kind === 'bare'
    const showNonGitRepositoryWarning = !isRepository || isRepositoryBare
    const repositoryUnsafePath = type.kind === 'unsafe' ? type.path : undefined

    this.setState(state =>
      path === state.path
        ? {
            isRepositoryBare,
            isRepositoryUnsafe,
            showNonGitRepositoryWarning,
            repositoryUnsafePath,
          }
        : null
    )

    return type
  }

  private buildBareRepositoryError() {
    if (
      !this.state.path.length ||
      !this.state.showNonGitRepositoryWarning ||
      !this.state.isRepositoryBare
    ) {
      return null
    }

    const msg =
      'This directory appears to be a bare repository. Bare repositories are not currently supported.'

    return { screenReaderMessage: msg, displayedMessage: msg }
  }

  private buildRepositoryUnsafeError() {
    const { repositoryUnsafePath, path } = this.state
    if (
      !this.state.path.length ||
      !this.state.showNonGitRepositoryWarning ||
      !this.state.isRepositoryUnsafe ||
      repositoryUnsafePath === undefined
    ) {
      return null
    }

    // Git for Windows will replace backslashes with slashes in the error
    // message so we'll do the same to not show "the repo at path c:/repo"
    // when the entered path is `c:\repo`.
    const convertedPath = __WIN32__ ? path.replaceAll('\\', '/') : path

    const displayedMessage = (
      <>
        <p>
          The Git repository
          {repositoryUnsafePath !== convertedPath && (
            <>
              {' at '}
              <Ref>{repositoryUnsafePath}</Ref>
            </>
          )}{' '}
          appears to be owned by another user on your machine. Adding untrusted
          repositories may automatically execute files in the repository.
        </p>
        <p>
          If you trust the owner of the directory you can
          <LinkButton onClick={this.onTrustDirectory}>
            {' '}
            add an exception for this directory
          </LinkButton>{' '}
          in order to continue.
        </p>
      </>
    )

    const screenReaderMessage = `The Git repository appears to be owned by another user on your machine.
      Adding untrusted repositories may automatically execute files in the repository.
      If you trust the owner of the directory you can add an exception for this directory in order to continue.`

    return { screenReaderMessage, displayedMessage }
  }

  private buildNotAGitRepositoryError(): IAccessibleMessage | null {
    if (!this.state.path.length || !this.state.showNonGitRepositoryWarning) {
      return null
    }

    const displayedMessage = (
      <>
        <p>This directory does not appear to be a Git repository.</p>
        <p>
          Would you like to{' '}
          <LinkButton onClick={this.onCreateRepositoryClicked}>
            create a repository
          </LinkButton>{' '}
          here instead?
        </p>
      </>
    )

    const screenReaderMessage =
      'This directory does not appear to be a Git repository. Would you like to create a repository here instead?'

    return { screenReaderMessage, displayedMessage }
  }

  private renderErrors() {
    const msg: IAccessibleMessage | null =
      this.buildBareRepositoryError() ??
      this.buildRepositoryUnsafeError() ??
      this.buildNotAGitRepositoryError()

    if (msg === null) {
      return null
    }

    return (
      <Row>
        <InputError
          id="add-existing-repository-path-error"
          ariaLiveMessage={msg.screenReaderMessage}
        >
          {msg.displayedMessage}
        </InputError>
      </Row>
    )
  }

  private renderFoundRepositories() {
    const { foundRepositories, selectedRepositoryPaths } = this.state

    if (foundRepositories.length === 0) {
      return null
    }

    return (
      <div className="found-repositories" aria-live="polite">
        <div className="found-repositories-header">
          <span>
            {foundRepositories.length} repositories found in this folder
          </span>
          <div className="found-repositories-actions">
            <LinkButton onClick={this.selectAllRepositories}>
              Select all
            </LinkButton>
            <LinkButton onClick={this.deselectAllRepositories}>
              Deselect all
            </LinkButton>
          </div>
        </div>
        <div className="found-repositories-list">
          {foundRepositories.map(repository => (
            <FoundRepositoryCheckbox
              key={repository.path}
              repository={repository}
              checked={selectedRepositoryPaths.has(repository.path)}
              onSelectionChanged={this.onRepositorySelectionChanged}
            />
          ))}
        </div>
      </div>
    )
  }

  public render() {
    return (
      <Dialog
        id="add-existing-repository"
        title={__DARWIN__ ? 'Add Local Repository' : 'Add local repository'}
        onSubmit={this.addRepository}
        onDismissed={this.props.onDismissed}
        disabled={
          this.state.isTrustingRepository || this.state.isFindingRepositories
        }
        loading={
          this.state.isTrustingRepository || this.state.isFindingRepositories
        }
      >
        <DialogContent>
          <Row>
            <TextBox
              ref={this.pathTextBoxRef}
              value={this.state.path}
              label={__DARWIN__ ? 'Local Path' : 'Local path'}
              placeholder="repository path"
              onValueChanged={this.onPathChanged}
              ariaDescribedBy="add-existing-repository-path-error"
            />
            <Button onClick={this.showFilePicker}>Choose…</Button>
          </Row>
          {this.renderErrors()}
          {this.renderFoundRepositories()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getAddButtonText()}
            okButtonDisabled={
              this.state.foundRepositories.length > 0 &&
              this.state.selectedRepositoryPaths.size === 0
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onPathChanged = (path: string) => {
    if (this.state.path !== path) {
      this.updatePath(path)
    }
  }

  private showFilePicker = async () => {
    const path = await showOpenDialog({
      properties: ['createDirectory', 'openDirectory'],
    })

    if (path === null) {
      return
    }

    this.updatePath(path)
    await this.findRepositories(path)
  }

  private resolvedPath(path: string): string {
    return Path.resolve('/', untildify(path))
  }

  private addRepository = async () => {
    const { foundRepositories, path, selectedRepositoryPaths } = this.state

    if (foundRepositories.length > 0) {
      const paths = foundRepositories
        .filter(repository => selectedRepositoryPaths.has(repository.path))
        .map(repository => repository.path)

      if (paths.length === 0) {
        return
      }

      await this.addRepositories(paths)
      return
    }

    const type = await this.validatePath(path)

    if (type.kind !== 'regular') {
      if (type.kind === 'missing') {
        const repositories = await this.findRepositories(path)
        if (repositories.length > 0) {
          return
        }
      }

      this.pathTextBoxRef.current?.focus()
      return
    }

    await this.addRepositories([this.resolvedPath(path)])
  }

  private addRepositories = async (paths: ReadonlyArray<string>) => {
    this.props.onDismissed()
    const { dispatcher } = this.props

    const repositories = await dispatcher.addRepositories(paths)

    if (repositories.length > 0) {
      dispatcher.closeFoldout(FoldoutType.Repository)
      dispatcher.selectRepository(repositories[0])
      dispatcher.recordAddExistingRepository()
    }
  }

  private findRepositories = async (
    path: string
  ): Promise<ReadonlyArray<IFoundRepository>> => {
    if (path.length === 0) {
      return []
    }

    this.setState({ isFindingRepositories: true })
    const repositories = await findRepositoriesInDirectory(
      this.resolvedPath(path)
    )

    this.setState(state =>
      state.path === path
        ? {
            isFindingRepositories: false,
            foundRepositories: repositories,
            selectedRepositoryPaths: new Set(
              repositories.map(repository => repository.path)
            ),
            showNonGitRepositoryWarning:
              repositories.length > 0
                ? false
                : state.showNonGitRepositoryWarning,
          }
        : null
    )

    return repositories
  }

  private onRepositorySelectionChanged = (path: string, checked: boolean) => {
    this.setState(state => {
      const selectedRepositoryPaths = new Set(state.selectedRepositoryPaths)

      if (checked) {
        selectedRepositoryPaths.add(path)
      } else {
        selectedRepositoryPaths.delete(path)
      }

      return { selectedRepositoryPaths }
    })
  }

  private selectAllRepositories = () => {
    this.setState(state => ({
      selectedRepositoryPaths: new Set(
        state.foundRepositories.map(repository => repository.path)
      ),
    }))
  }

  private deselectAllRepositories = () => {
    this.setState({ selectedRepositoryPaths: new Set() })
  }

  private getAddButtonText() {
    const count = this.state.selectedRepositoryPaths.size

    if (this.state.foundRepositories.length === 0) {
      return __DARWIN__ ? 'Add Repository' : 'Add repository'
    }

    const repositoryLabel = count === 1 ? 'Repository' : 'Repositories'
    return `Add ${count} ${
      __DARWIN__ ? repositoryLabel : repositoryLabel.toLowerCase()
    }`
  }

  private onCreateRepositoryClicked = () => {
    this.props.onDismissed()

    const resolvedPath = this.resolvedPath(this.state.path)

    return this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
      path: resolvedPath,
    })
  }
}
