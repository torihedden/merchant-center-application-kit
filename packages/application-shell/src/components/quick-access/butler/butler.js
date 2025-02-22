import React from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { FormattedMessage } from 'react-intl';
import last from 'lodash/last';
import { css, keyframes, ClassNames } from '@emotion/core';
import {
  SearchIcon,
  LoadingSpinner,
  customProperties,
} from '@commercetools-frontend/ui-kit';
import { flattenResults } from '../utils';
import ButlerCommand from '../butler-command';
import ButlerContainer from '../butler-container';
import messages from '../messages';

const isSelectAllCombo = event =>
  event.key === 'a' &&
  event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

const isCloseCombo = event =>
  event.key === 'Escape' &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

const getPlatform = () => {
  if (navigator.appVersion.includes('Win')) return 'windows';
  if (navigator.appVersion.includes('Mac')) return 'macos';
  if (navigator.appVersion.includes('X11')) return 'unix';
  if (navigator.appVersion.includes('Linux')) return 'linux';

  return null;
};

const hasNewWindowModifier = event => {
  const platform = getPlatform();
  switch (platform) {
    case 'macos':
      return event.metaKey;
    default:
      return event.ctrlKey;
  }
};

const shakeAnimation = keyframes`
  from,
  to {
    transform: translate3d(0, 0, 0);
  }

  14%,
  42%,
  70% {
    transform: translate3d(-3px, 0, 0);
  }

  28%,
  56%,
  84% {
    transform: translate3d(3px, 0, 0);
  }
`;

export class Butler extends React.Component {
  static displayName = 'Butler';

  static propTypes = {
    intl: PropTypes.shape({
      formatMessage: PropTypes.func.isRequired,
    }).isRequired,
    historyEntries: PropTypes.arrayOf(
      PropTypes.shape({
        searchText: PropTypes.string.isRequired,
        results: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
          })
        ),
      })
    ).isRequired,
    onHistoryEntriesChange: PropTypes.func.isRequired,
    search: PropTypes.func.isRequired,
    getNextCommands: PropTypes.func.isRequired,
    executeCommand: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    classNameShakeAnimation: PropTypes.string.isRequired,
  };

  state = {
    hasNetworkError: false,
    isLoading: false,
    searchText: '',
    selectedResult: -1,
    // Used for UX when browsing through history
    enableHistory: true,
    results: [],
    stack: [],
  };

  shouldSelectFieldText = false;
  searchContainerRef = React.createRef();
  searchInputRef = React.createRef();

  setNetworkError = () => {
    this.setState({ hasNetworkError: true });
  };

  setIsLoading = () => {
    this.setState({
      isLoading: true,
    });
  };

  setIsNotLoading = () => {
    this.setState({
      isLoading: false,
    });
  };

  shake = () => {
    this.searchContainerRef.current.classList.remove(
      this.props.classNameShakeAnimation
    );
    // -> triggering reflow
    // eslint-disable-next-line no-void
    void this.searchContainerRef.current.offsetWidth;
    this.searchContainerRef.current.classList.add(
      this.props.classNameShakeAnimation
    );
  };

  handleKeyDown = event => {
    // Preventing cursor jumps can only happen in onKeyDown, but not in onKeyUp
    event.persist();

    // We want to know when the user presses cmd+enter (cmd being a meta key).
    // We are only told about this in keyDown, but not in keyUp, so we need
    // to handle it here
    if (event.key === 'Enter' && hasNewWindowModifier(event)) {
      this.isNewWindowCombo = true;
      return;
    }

    // Avoid selecting the whole page when user selectes everything with
    // a keyboard shortcut. There is probably a better way to do this though.
    // This prevents the whole page from being selected in case the user
    // 1) opens the search box
    // 2) types into it
    // 3) selects all text using cmd+a
    // 4) closes the search box with esc
    // Without this handling, the whole page would now be selected
    if (isSelectAllCombo(event)) {
      // This stops the browser from selecting anything
      event.preventDefault();
      // This selects the text in the search input
      this.searchInputRef.current.setSelectionRange(
        0,
        this.state.searchText.length
      );
      return;
    }

    // avoid interfering with other key combinations using modifier keys
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
      return;
    if (isCloseCombo(event)) return;

    // skip next mouseEnter to avoid setting selectedResult when cursor just
    // happens to be where the results will pop up
    this.skipNextSelection = true;

    this.setState(prevState => {
      if (event.key === 'ArrowDown') {
        // prevent cursor from jumping to end of text input
        event.preventDefault();
        return {
          selectedResult:
            prevState.selectedResult === prevState.results.length - 1
              ? 0
              : prevState.selectedResult + 1,
          enableHistory: false,
        };
      }
      if (event.key === 'ArrowUp') {
        // browse through history
        if (
          prevState.searchText.length === 0 ||
          (prevState.selectedResult < 1 && prevState.enableHistory)
        ) {
          this.shouldSelectFieldText = true;
          const selectedIndex =
            prevState.searchText.length === 0
              ? // When going back the first step
                -1
              : // When going back more than one step
                this.props.historyEntries.findIndex(
                  command => command.searchText === prevState.searchText
                );
          // Pick the previous command from the history
          const prevCommand =
            selectedIndex === -1
              ? // previous command on top of the history when going back on
                // first step
                last(this.props.historyEntries)
              : // previous command is deeper down
                // When the history does not exist (negative index), then
                // this implicitly returns undefined
                this.props.historyEntries[selectedIndex - 1];
          // Skip when no previous entry exists in the history
          if (!prevCommand) return null;
          return {
            selectedResult: 0,
            searchText: prevCommand.searchText,
            results: prevCommand.results,
            stack: [],
            // The history does not get changed here, it will be changed along
            // with the regular flow.
          };
        }
        // prevent cursor from jumping to beginning of text input
        event.preventDefault();
        return {
          selectedResult:
            prevState.selectedResult < 1
              ? prevState.results.length - 1
              : prevState.selectedResult - 1,
          enableHistory: false,
        };
      }
      if (prevState.selectedResult > -1) {
        if (event.key === 'ArrowRight') {
          const command = prevState.results[prevState.selectedResult];
          const searchText = prevState.searchText;
          const isCursorAtEnd =
            prevState.searchText.length ===
            this.searchInputRef.current.selectionStart;

          const isEverythingSelected =
            this.searchInputRef.current.selectionStart === 0 &&
            prevState.searchText.length ===
              this.searchInputRef.current.selectionEnd;

          // only allow diving in when cursor is at end of input or when
          // the complete text is selected (when browsing through history)
          if (!isCursorAtEnd && !isEverythingSelected) return null;

          const nextCommands = this.props.getNextCommands(command);
          this.setState({ hasNetworkError: false });
          if (nextCommands.length > 0) {
            // avoid moving cursor when there are sub-options
            this.setState(prev =>
              // Ensure the search text has not changed while we were loading
              // the next results, otherwise we'd interrupt the user.
              // Throw away the results in case the search text has changed.
              prev.searchText === searchText
                ? {
                    stack: [
                      ...prevState.stack,
                      {
                        searchText: prevState.searchText,
                        results: prevState.results,
                        selectedResult: prevState.selectedResult,
                      },
                    ],
                    selectedResult: 0,
                    enableHistory: false,
                    results: nextCommands || [],
                  }
                : null
            );
          } else {
            this.shake();
          }

          return null;
        }
        if (event.key === 'ArrowLeft') {
          // go left in stack
          const prevCommand = last(prevState.stack);

          // do nothing when we can't go left anymore
          if (!prevCommand) return null;

          // prevent cursor from jumping a char to the left in text input
          event.preventDefault();

          return {
            searchText: prevCommand.searchText,
            results: prevCommand.results,
            selectedResult: 0,
            enableHistory: false,
            // omit last item
            stack: prevState.stack.slice(0, -1),
          };
        }
      }
      return null;
    });
  };

  handleKeyUp = event => {
    // setting the selection can only happen in onKeyUp
    if (this.shouldSelectFieldText) {
      event.target.focus();
      event.target.select();
      this.shouldSelectFieldText = false;
    }

    if (event.key !== 'Enter' && !this.isNewWindowCombo) return true;

    // User just triggered the search
    if (this.state.selectedResult === -1) return true;

    // User had something selected and wants to go there
    this.execute(this.state.results[this.state.selectedResult], {
      openInNewTab: this.isNewWindowCombo,
    });

    this.isNewWindowCombo = false;
    return true;
  };

  handleChange = event => {
    const searchText = event.target.value;
    this.setState(
      prevState => ({
        searchText,
        // clear network error when search text is cleared, so that users
        // are tempted to retry
        hasNetworkError: searchText.length > 0 && prevState.hasNetworkError,
      }),
      () => {
        this.search(searchText);
      }
    );
  };

  search = searchText => {
    if (searchText.trim().length === 0) {
      this.setState({
        results: [],
        selectedResult: -1,
        enableHistory: true,
        stack: [],
      });
      return;
    }

    // A search via network is only triggered when there
    // are more than three characters. So no false loading
    // indication is given.
    if (searchText.trim().length > 3) {
      this.setIsLoading();
    }

    this.props.search(searchText).then(
      asyncResults => {
        this.setState({ hasNetworkError: false });
        this.setIsNotLoading();
        const flatResults = flattenResults(asyncResults);

        const fuse = new Fuse(flatResults, {
          keys: [
            { name: 'text', weight: 0.6 },
            { name: 'keywords', weight: 0.4 },
          ],
          tokenize: false,
        });

        const results = fuse.search(searchText).slice(0, 9);

        this.setState(prevState =>
          prevState.searchText === searchText
            ? {
                results,
                selectedResult: results.length > 0 ? 0 : -1,
                enableHistory: true,
                stack: [],
              }
            : null
        );
      },
      error => {
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV !== 'production') console.error(error);
        this.setIsNotLoading();
        this.setNetworkError();
      }
    );
  };

  execute = (command, meta) => {
    this.appendHistoryEntry({
      searchText: this.state.searchText,
      results: this.state.results,
      stack: this.state.stack,
    });

    this.setState(
      {
        searchText: '',
        results: [],
        selectedResult: -1,
      },
      () => {
        this.props.onClose();
        this.props.executeCommand(command, meta);
      }
    );
  };

  handleContainerClick = () => {
    this.setState(
      {
        selectedResult: -1,
        enableHistory: true,
      },
      this.props.onClose
    );
  };

  appendHistoryEntry = ({ searchText, results, stack }) => {
    // Only main entries get added to history, so when a subcommand is executed,
    // we add the main command of it to the history (the top-level command).
    //
    // The key to identify history entries by is always the searchText
    // There will never be two history entries with the same searchText
    const entry =
      stack.length === 0
        ? // The stack is empty, so we are executing a top-level command
          { searchText, results }
        : // We are executing a subcommand, so we get the top-level command for it,
          // which is at the bottom of the stack.
          { searchText: stack[0].searchText, results: stack[0].results };

    // Add the entry to the history, while excluding any earlier history entry
    // with the same search text. This effectively "moves" that entry to the
    // top of the history (with the most recent results), or appends a new entry
    // when it didn't exist before.
    this.props.onHistoryEntriesChange([
      ...this.props.historyEntries.filter(
        command => command.searchText !== entry.searchText
      ),
      entry,
    ]);
  };

  render() {
    return (
      <ButlerContainer
        onClick={this.handleContainerClick}
        data-testid="quick-access"
        tabIndex={-1}
      >
        <div
          ref={this.searchContainerRef}
          css={css`
            background-color: ${customProperties.colorSurface};
            border: 0;
            border-radius: ${customProperties.borderRadius4};
            min-height: 40px;

            /* one more than app-bar (20000) and one more than the overlay (20001) */
            z-index: 20002;
            width: 400px;
            margin: 40px auto;
            overflow: hidden;
            -webkit-box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.75);
            -moz-box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.75);
            box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.75);
            padding-bottom: ${this.state.hasNetworkError
              ? '0'
              : customProperties.spacingS};
          `}
          onClick={event => {
            // Avoid closing when the searchContainer itself is clicked
            // If we don't do this, then the overlay will close when e.g.
            // the search input is clicked.
            event.stopPropagation();
            event.preventDefault();
          }}
        >
          <div
            css={css`
              display: flex;
            `}
          >
            <label
              htmlFor="quick-access-search-input"
              css={css`
                align-self: center;
                padding-left: ${customProperties.spacingM};
                margin-top: ${customProperties.spacingS};
              `}
            >
              <SearchIcon theme="grey" />
            </label>
            <input
              id="quick-access-search-input"
              ref={this.searchInputRef}
              placeholder={this.props.intl.formatMessage(
                messages.inputPlacehoder
              )}
              type="text"
              css={css`
                width: 100%;
                border: 0;
                outline: 0;
                font-size: 22px;
                font-weight: 300;
                padding: ${customProperties.spacingM}
                  ${customProperties.spacingM} ${customProperties.spacingS}
                  ${customProperties.spacingS};
                &::placeholder {
                  color: ${customProperties.colorNeutral60};
                }
              `}
              value={this.state.searchText}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              onKeyUp={this.handleKeyUp}
              autoFocus={true}
              data-testid="quick-access-search-input"
            />
            {this.state.isLoading && (
              <div
                css={css`
                  align-self: center;
                  margin-top: ${customProperties.spacingS};
                  margin-right: ${customProperties.spacingS};
                `}
              >
                <LoadingSpinner />
              </div>
            )}
          </div>
          {(() => {
            if (this.state.hasNetworkError)
              return (
                <div
                  css={css`
                    overflow: hidden;
                    white-space: nowrap;
                    cursor: default;
                    background: ${customProperties.colorError};
                    text-align: center;
                    text-transform: uppercase;
                    color: ${customProperties.colorSurface};
                    font-size: ${customProperties.fontSizeSmall};
                    padding: ${customProperties.spacingXs};
                  `}
                >
                  <FormattedMessage {...messages.offline} />
                </div>
              );

            if (
              this.state.results.length === 0 &&
              this.state.searchText.trim().length > 0
            )
              return (
                <div
                  css={css`
                    overflow: hidden;
                    white-space: nowrap;
                    cursor: default;
                    background: ${customProperties.colorNeutral};
                    color: ${customProperties.colorSolid};
                    text-align: center;
                    text-transform: uppercase;
                    font-size: ${customProperties.fontSizeSmall};
                    padding: ${customProperties.spacingXs};
                  `}
                >
                  <FormattedMessage {...messages.noResults} />
                </div>
              );

            return this.state.results.map((command, index) => (
              <ButlerCommand
                key={command.id}
                command={command}
                isSelected={this.state.selectedResult === index}
                onMouseEnter={() => {
                  // In case the cursor happened to be in a location where a
                  // result would appear, it would trigger onMouseEnter and the
                  // result would be selected immediately. This is not something
                  // a user would expect, hence we prevent it from happening.
                  // The user has to move the cursor to an option explicitly for
                  // it to become active. However, the user can always click and
                  // that action will be triggered.
                  if (this.skipNextSelection) {
                    this.skipNextSelection = false;
                    return;
                  }

                  // sets the selected result, mainly for the hover effect
                  this.setState({ selectedResult: index });
                }}
                onClick={event => {
                  this.execute(command, {
                    openInNewTab: hasNewWindowModifier(event),
                  });
                }}
              />
            ));
          })()}
        </div>
      </ButlerContainer>
    );
  }
}

const ButlerWithAnimation = props => (
  <ClassNames>
    {({ css }) => (
      <Butler
        {...props}
        classNameShakeAnimation={css`
          animation-duration: 0.45s;
          animation-fill-mode: both;
          animation-name: ${shakeAnimation};
        `}
      />
    )}
  </ClassNames>
);

export default ButlerWithAnimation;
