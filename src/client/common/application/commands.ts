// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { CancellationToken, Uri } from 'vscode';
import { Commands as DSCommands } from '../../datascience/constants';
import { CommandSource } from '../../unittests/common/constants';
import { TestsToRun } from '../../unittests/common/types';
import { TestDataItem } from '../../unittests/types';
import { Commands } from '../constants';

export type CommandsWithoutArgs = 'python.debugger.replaceExperimental' | 'python.setInterpreter';

/**
 * Mapping between commands and list or arguments.
 * These commands do NOT have any arguments.
 * @interface ICommandNameWithoutArgumentTypeMapping
 */
interface ICommandNameWithoutArgumentTypeMapping {
    ['python.debugger.replaceExperimental']: [];
    ['python.setInterpreter']: [];
    ['python.runLinting']: [];
}

/**
 * Mapping between commands and list of arguments.
 * Used to provide strong typing for command & args.
 * @export
 * @interface ICommandNameArgumentTypeMapping
 * @extends {ICommandNameWithoutArgumentTypeMapping}
 */
export interface ICommandNameArgumentTypeMapping extends ICommandNameWithoutArgumentTypeMapping {
    ['workbench.action.reloadWindow']: [];
    ['setContext']: [string, boolean];
    ['editor.action.formatDocument']: [];
    ['revealLine']: [{ lineNumber: number; at: 'top' | 'center' | 'bottom' }];
    ['editor.action.rename']: [];
    [Commands.Set_Linter]: [];
    [Commands.Build_Workspace_Symbols]: [boolean, CancellationToken];
    [Commands.Tests_ViewOutput]: [undefined, CommandSource];
    [Commands.Tests_Stop]: [undefined, Uri];
    [Commands.Tests_Run]: [undefined, CommandSource, Uri] | [undefined, CommandSource, Uri, TestsToRun];
    [Commands.Tests_Debug]: [undefined, CommandSource, Uri] | [undefined, CommandSource, Uri, TestsToRun];
    [Commands.Tests_Discover]: [undefined, CommandSource, Uri];
    [Commands.Tests_Run_Failed]: [undefined, CommandSource, Uri];
    [Commands.Tests_Select_And_Debug_Method]: [undefined, CommandSource, Uri];
    [Commands.Tests_Select_And_Run_Method]: [undefined, CommandSource, Uri];
    [Commands.Tests_Configure]: [] | [undefined, CommandSource];
    [Commands.navigateToTestFile]: [Uri, TestDataItem, boolean];
    [Commands.navigateToTestFunction]: [Uri, TestDataItem, boolean];
    [Commands.navigateToTestSuite]: [Uri, TestDataItem, boolean];
    [DSCommands.ExportFileAndOutputAsNotebook]: [Uri];
}
