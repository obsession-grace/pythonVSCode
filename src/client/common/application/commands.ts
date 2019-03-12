// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { CancellationToken, Uri } from 'vscode';
import { Commands as DSCommands } from '../../datascience/constants';
import { CommandSource } from '../../unittests/common/constants';
import { TestFunction, TestsToRun } from '../../unittests/common/types';
import { TestDataItem, TestWorkspaceFolder } from '../../unittests/types';
import { Commands } from '../constants';

// export type CommandsWithoutArgs = 'python.debugger.replaceExperimental' | 'python.setInterpreter' |
//     'python.runLinting' | typeof Commands.Enable_SourceMap_Support;

export type CommandsWithoutArgs = keyof ICommandNameWithoutArgumentTypeMapping;

/**
 * Mapping between commands and list or arguments.
 * These commands do NOT have any arguments.
 * @interface ICommandNameWithoutArgumentTypeMapping
 */
interface ICommandNameWithoutArgumentTypeMapping {
    ['python.debugger.replaceExperimental']: [];
    [Commands.Set_Interpreter]: [];
    [Commands.Set_ShebangInterpreter]: [];
    [Commands.Run_Linter]: [];
    [Commands.Enable_Linter]: [];
    ['workbench.action.reloadWindow']: [];
    ['editor.action.formatDocument']: [];
    ['editor.action.rename']: [];
    [Commands.ViewOutput]: [];
    [Commands.Set_Linter]: [];
    [Commands.Start_REPL]: [];
    [Commands.Enable_SourceMap_Support]: [];
    [Commands.Exec_Selection_In_Terminal]: [];
    [Commands.Exec_Selection_In_Django_Shell]: [];
    [Commands.Create_Terminal]: [];
    [Commands.Tests_View_UI]: [];
    [Commands.Tests_Ask_To_Stop_Discovery]: [];
    [Commands.Tests_Ask_To_Stop_Test]: [];
    [Commands.Tests_Discovering]: [];
    [DSCommands.RunCurrentCell]: [];
    [DSCommands.RunCurrentCellAdvance]: [];
    [DSCommands.ExecSelectionInInteractiveWindow]: [];
    [DSCommands.SelectJupyterURI]: [];
    [DSCommands.ShowHistoryPane]: [];
    [DSCommands.UndoCells]: [];
    [DSCommands.RedoCells]: [];
    [DSCommands.RemoveAllCells]: [];
    [DSCommands.InterruptKernel]: [];
    [DSCommands.RestartKernel]: [];
    [DSCommands.ExpandAllCells]: [];
    [DSCommands.CollapseAllCells]: [];
    [DSCommands.ExportOutputAsNotebook]: [];
}

/**
 * Mapping between commands and list of arguments.
 * Used to provide strong typing for command & args.
 * @export
 * @interface ICommandNameArgumentTypeMapping
 * @extends {ICommandNameWithoutArgumentTypeMapping}
 */
export interface ICommandNameArgumentTypeMapping extends ICommandNameWithoutArgumentTypeMapping {
    ['setContext']: [string, boolean];
    ['revealLine']: [{ lineNumber: number; at: 'top' | 'center' | 'bottom' }];
    ['python._loadLanguageServerExtension']: {}[];
    [Commands.Build_Workspace_Symbols]: [boolean, CancellationToken];
    [Commands.Sort_Imports]: [undefined, Uri];
    [Commands.Exec_In_Terminal]: [undefined, Uri];
    [Commands.Tests_ViewOutput]: [undefined, CommandSource];
    [Commands.Tests_Select_And_Run_File]: [undefined, CommandSource];
    [Commands.Tests_Run_Current_File]: [undefined, CommandSource];
    [Commands.Tests_Stop]: [undefined, Uri];
    [Commands.Tests_Run]: [undefined, CommandSource, Uri] | [undefined, CommandSource, Uri, TestsToRun];
    [Commands.Tests_Debug]: [undefined | TestWorkspaceFolder, undefined | CommandSource, Uri, TestsToRun];
    [Commands.Tests_Discover]: [undefined, CommandSource, Uri];
    [Commands.Tests_Run_Failed]: [undefined, CommandSource, Uri];
    [Commands.Tests_Select_And_Debug_Method]: [undefined, CommandSource, Uri];
    [Commands.Tests_Select_And_Run_Method]: [undefined, CommandSource, Uri];
    [Commands.Tests_Configure]: [undefined, undefined | CommandSource, undefined | Uri];
    [Commands.Tests_Picker_UI]: [undefined, undefined | CommandSource, Uri, TestFunction[]];
    [Commands.Tests_Picker_UI_Debug]: [undefined, undefined | CommandSource, Uri, TestFunction[]];
    [Commands.runTestNode]: [TestDataItem];
    [Commands.debugTestNode]: [TestDataItem];
    [Commands.openTestNodeInEditor]: [TestDataItem];
    [Commands.navigateToTestFile]: [Uri, TestDataItem, boolean];
    [Commands.navigateToTestFunction]: [Uri, TestDataItem, boolean];
    [Commands.navigateToTestSuite]: [Uri, TestDataItem, boolean];
    [DSCommands.ExportFileAndOutputAsNotebook]: [Uri];
    [DSCommands.RunAllCells]: [string];
    [DSCommands.RunCell]: [string, number, number, number, number];
    [DSCommands.RunAllCellsAbove]: [string, number, number];
    [DSCommands.RunCellAndAllBelow]: [string, number, number];
    [DSCommands.RunToLine]: [string, number, number];
    [DSCommands.RunFromLine]: [string, number, number];
    [DSCommands.ImportNotebook]: [undefined | Uri, undefined | CommandSource];
    [DSCommands.ExportFileAsNotebook]: [undefined | Uri, undefined | CommandSource];
}
