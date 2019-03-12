// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { anything, instance, mock, verify } from 'ts-mockito';
import { Uri } from 'vscode';
import { CommandManager } from '../../../client/common/application/commandManager';
import { Commands } from '../../../client/common/constants';
import { getNamesAndValues } from '../../../client/common/utils/enum';
import { CommandSource } from '../../../client/unittests/common/constants';
import { onItemSelected, Type } from '../../../client/unittests/display/picker';

// tslint:disable:no-any

suite('xUnit Tests - Picker (execution of commands)', () => {
    getNamesAndValues<Type>(Type).forEach(item => {
        getNamesAndValues<CommandSource>(Type).forEach(commandSource => {
            [true, false].forEach(debug => {
                test(`Invoking command for selection ${item.name} from ${commandSource.name} (${debug ? 'Debug' : 'No debug'})`, async () => {
                    const commandManager = mock(CommandManager);
                    const workspaceUri = Uri.file(__filename);

                    const testFunction = 'some test Function';
                    const selection = { type: item.value, fn: { testFunction } };
                    onItemSelected(instance(commandManager), commandSource.value, workspaceUri, selection as any, debug);

                    let cmd = '';
                    const commandArgs: any[] = [undefined, commandSource.value, workspaceUri];
                    switch (selection.type) {
                        case Type.Null: {
                            verify(commandManager.executeCommand(anything())).never();
                            const args: any[] = [];
                            for (let i = 0; i <= 7; i += 1) {
                                args.push(anything());
                            }
                            verify(commandManager.executeCommand(anything(), ...args)).never();
                            return;
                        }
                        case Type.RunAll: {
                            cmd = Commands.Tests_Run;
                            break;
                        }
                        case Type.ReDiscover: {
                            cmd = Commands.Tests_Discover;
                            break;
                        }
                        case Type.ViewTestOutput: {
                            cmd = Commands.Tests_ViewOutput;
                            break;
                        }
                        case Type.RunFailed: {
                            cmd = Commands.Tests_Run_Failed;
                            break;
                        }
                        case Type.SelectAndRunMethod: {
                            cmd = debug ? Commands.Tests_Select_And_Debug_Method : Commands.Tests_Select_And_Run_Method;
                            break;
                        }
                        case Type.RunMethod: {
                            cmd = Commands.navigateToTestFunction;
                            commandArgs.push(selection.fn!.testFunction);
                            break;
                        }
                        case Type.DebugMethod: {
                            cmd = Commands.Tests_Debug;
                            commandArgs.push(selection.fn!.testFunction);
                            commandArgs.push(true);
                            break;
                        }
                        case Type.Configure: {
                            cmd = Commands.Tests_Configure;
                            break;
                        }
                        default: {
                            return;
                        }
                    }

                    verify(commandManager.executeCommand(cmd, ...commandArgs)).once();
                });
            });
        });
    });
});
