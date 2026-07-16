import { useEffect, useRef, useState } from 'react';
import { useColorScheme } from '@mui/material/styles';

import type * as MonacoReactNs from '@monaco-editor/react';
import MonacoEditor from '@monaco-editor/react';
import type MonacoEditorNs from 'monaco-editor';

import { configureMonacoLoader } from '@/monaco/configureMonacoLoader';
import { formatJsonWithComments } from '@/utils/json-utils';

type Monaco = typeof MonacoEditorNs;
type Editor = MonacoEditorNs.editor.IStandaloneCodeEditor;

configureMonacoLoader();

export interface JsonViewerProps {
  object: unknown;
  height?: number | string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  object,
  height = '90vh',
}) => {
  const { mode, systemMode } = useColorScheme();
  const editorRef = useRef<Editor>(null);
  const monacoRef = useRef<Monaco>(null);
  const [json, setJson] = useState<string>('{}');

  const activeMode = mode === 'system' ? systemMode : mode;

  useEffect(() => {
    formatJsonWithComments(object).then(
      (str) => {
        setJson(str);
      },
      (error: unknown) => {
        console.error(error);
      },
    );
  }, [object]);

  const autoFold = (editor: Editor | null | undefined): void => {
    if (!editor) {
      return;
    }

    // If the JSON object is an array, don't auto-fold all of the objects in it.
    if (editor.getValue().startsWith('[')) {
      editor.trigger('fold', 'editor.foldLevel3' satisfies MonacoCommandId, {});
    } else {
      editor.trigger('fold', 'editor.foldLevel2' satisfies MonacoCommandId, {});
    }
  };

  const handleEditorDidMount: MonacoReactNs.OnMount = (
    editor: Editor,
    monaco: Monaco,
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    autoFold(editor);
  };

  const handleEditorWillMount: MonacoReactNs.BeforeMount = (monaco: Monaco) => {
    monaco.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true, // This allows // and /* */ comments
      trailingCommas: 'ignore', // Optional: handles trailing commas if needed
    });
  };

  const handleEditorChange: MonacoReactNs.OnChange = (
    _value: string | undefined,
    _event: MonacoEditorNs.editor.IModelContentChangedEvent,
  ) => {
    autoFold(editorRef.current);
  };

  return (
    <MonacoEditor
      height={height}
      language="json"
      value={json}
      theme={
        (activeMode === 'dark'
          ? 'vs-dark'
          : 'light') satisfies MonacoReactNs.Theme
      }
      options={{
        readOnly: true,
        domReadOnly: true,
        folding: true,
        foldingStrategy: 'auto',
        minimap: {
          enabled: true,
          autohide: 'none',
          showSlider: 'always',
        },
      }}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
};

/**
 * @see https://code.visualstudio.com/docs/reference/default-keybindings
 */
type MonacoCommandId =
  | 'actions.find'
  | 'breadcrumbs.focus'
  | 'breadcrumbs.focusAndSelect'
  | 'cursorBottom'
  | 'cursorEnd'
  | 'cursorHome'
  | 'cursorTop'
  | 'cursorUndo'
  | 'editor.action.addCommentLine'
  | 'editor.action.addSelectionToNextFindMatch'
  | 'editor.action.blockComment'
  | 'editor.action.changeAll'
  | 'editor.action.clipboardCopyAction'
  | 'editor.action.clipboardCutAction'
  | 'editor.action.clipboardPasteAction'
  | 'editor.action.commentLine'
  | 'editor.action.copyLinesDownAction'
  | 'editor.action.copyLinesUpAction'
  | 'editor.action.deleteLines'
  | 'editor.action.formatDocument'
  | 'editor.action.formatSelection'
  | 'editor.action.goToReferences'
  | 'editor.action.indentLines'
  | 'editor.action.inlineSuggest.commit'
  | 'editor.action.inPlaceReplace.down'
  | 'editor.action.inPlaceReplace.up'
  | 'editor.action.insertCursorAbove'
  | 'editor.action.insertCursorAtEndOfEachLineSelected'
  | 'editor.action.insertCursorBelow'
  | 'editor.action.insertLineAfter'
  | 'editor.action.insertLineBefore'
  | 'editor.action.jumpToBracket'
  | 'editor.action.marker.nextInFiles'
  | 'editor.action.marker.prevInFiles'
  | 'editor.action.moveLinesDownAction'
  | 'editor.action.moveLinesUpAction'
  | 'editor.action.moveSelectionToNextFindMatch'
  | 'editor.action.nextMatchFindAction'
  | 'editor.action.outdentLines'
  | 'editor.action.peekDefinition'
  | 'editor.action.previousMatchFindAction'
  | 'editor.action.quickFix'
  | 'editor.action.removeCommentLine'
  | 'editor.action.rename'
  | 'editor.action.revealDefinition'
  | 'editor.action.revealDefinitionAside'
  | 'editor.action.selectAllMatches'
  | 'editor.action.selectHighlights'
  | 'editor.action.showHover'
  | 'editor.action.smartSelect.expand'
  | 'editor.action.smartSelect.shrink'
  | 'editor.action.startFindReplaceAction'
  | 'editor.action.toggleTabFocusMode'
  | 'editor.action.toggleWordWrap'
  | 'editor.action.triggerParameterHints'
  | 'editor.action.triggerSuggest'
  | 'editor.action.trimTrailingWhitespace'
  | 'editor.debug.action.toggleBreakpoint'
  | 'editor.fold'
  | 'editor.foldLevel1'
  | 'editor.foldLevel2'
  | 'editor.foldLevel3'
  | 'editor.foldLevel4'
  | 'editor.foldLevel5'
  | 'editor.foldLevel6'
  | 'editor.foldLevel7'
  | 'editor.foldAll'
  | 'editor.foldRecursively'
  | 'editor.toggleFold'
  | 'editor.unfold'
  | 'editor.unfoldLevel1'
  | 'editor.unfoldLevel2'
  | 'editor.unfoldLevel3'
  | 'editor.unfoldLevel4'
  | 'editor.unfoldLevel5'
  | 'editor.unfoldLevel6'
  | 'editor.unfoldLevel7'
  | 'editor.unfoldAll'
  | 'editor.unfoldRecursively'
  | 'expandLineSelection'
  | 'history.showNext'
  | 'history.showPrevious'
  | 'inlineChat.start'
  | 'markdown.showPreviewToSide'
  | 'markdown.togglePreview'
  | 'redo'
  | 'rerunSearchEditorSearch'
  | 'saveAll'
  | 'scrollLineDown'
  | 'scrollLineUp'
  | 'scrollPageDown'
  | 'scrollPageUp'
  | 'search.action.focusNextSearchResult'
  | 'search.action.focusPreviousSearchResult'
  | 'search.action.focusQueryEditorWidget'
  | 'search.action.openInEditor'
  | 'search.searchEditor.action.deleteFileResults'
  | 'toggleFindCaseSensitive'
  | 'toggleFindRegex'
  | 'toggleFindWholeWord'
  | 'toggleSearchCaseSensitive'
  | 'toggleSearchRegex'
  | 'toggleSearchWholeWord'
  | 'undo'
  | 'workbench.action.chat.newChat'
  | 'workbench.action.chat.open'
  | 'workbench.action.chat.openagent'
  | 'workbench.action.chat.openModelPicker'
  | 'workbench.action.chat.openModePicker'
  | 'workbench.action.closeActiveEditor'
  | 'workbench.action.closeAllEditors'
  | 'workbench.action.closeEditorsInGroup'
  | 'workbench.action.closeFolder'
  | 'workbench.action.closeWindow'
  | 'workbench.action.debug.continue'
  | 'workbench.action.debug.pause'
  | 'workbench.action.debug.run'
  | 'workbench.action.debug.start'
  | 'workbench.action.debug.stepInto'
  | 'workbench.action.editor.changeLanguageMode'
  | 'workbench.action.exitZenMode'
  | 'workbench.action.files.copyPathOfActiveFile'
  | 'workbench.action.files.newUntitledFile'
  | 'workbench.action.files.openFile'
  | 'workbench.action.files.revealActiveFileInWindows'
  | 'workbench.action.files.save'
  | 'workbench.action.files.saveAs'
  | 'workbench.action.focusFirstEditorGroup'
  | 'workbench.action.focusLeftGroup'
  | 'workbench.action.focusRightGroup'
  | 'workbench.action.focusSecondEditorGroup'
  | 'workbench.action.focusThirdEditorGroup'
  | 'workbench.action.gotoLine'
  | 'workbench.action.gotoSymbol'
  | 'workbench.action.keepEditor'
  | 'workbench.action.moveActiveEditorGroupLeft'
  | 'workbench.action.moveActiveEditorGroupRight'
  | 'workbench.action.moveEditorLeftInGroup'
  | 'workbench.action.moveEditorRightInGroup'
  | 'workbench.action.moveEditorToNextGroup'
  | 'workbench.action.moveEditorToPreviousGroup'
  | 'workbench.action.navigateBack'
  | 'workbench.action.navigateForward'
  | 'workbench.action.newWindow'
  | 'workbench.action.openGlobalKeybindings'
  | 'workbench.action.openSettings'
  | 'workbench.action.output.toggleOutput'
  | 'workbench.action.quickchat.toggle'
  | 'workbench.action.quickInputBack'
  | 'workbench.action.quickOpen'
  | 'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup'
  | 'workbench.action.quickOpenView'
  | 'workbench.action.reopenClosedEditor'
  | 'workbench.action.replaceInFiles'
  | 'workbench.action.search.toggleQueryDetails'
  | 'workbench.action.selectTheme'
  | 'workbench.action.showAllSymbols'
  | 'workbench.action.showCommands'
  | 'workbench.action.splitEditor'
  | 'workbench.action.tasks.build'
  | 'workbench.action.terminal.chat.start'
  | 'workbench.action.terminal.openNativeConsole'
  | 'workbench.action.terminal.toggleTerminal'
  | 'workbench.action.toggleFullScreen'
  | 'workbench.action.toggleSidebarVisibility'
  | 'workbench.action.toggleZenMode'
  | 'workbench.action.zoomIn'
  | 'workbench.action.zoomOut'
  | 'workbench.action.zoomReset'
  | 'workbench.actions.view.problems'
  | 'workbench.view.debug'
  | 'workbench.view.explorer'
  | 'workbench.view.extensions'
  | 'workbench.view.scm'
  | 'workbench.view.search';
