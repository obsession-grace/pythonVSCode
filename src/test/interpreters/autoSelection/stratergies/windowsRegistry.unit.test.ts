// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any

import { expect } from 'chai';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { PlatformService } from '../../../../client/common/platform/platformService';
import { IPlatformService } from '../../../../client/common/platform/types';
import { IPersistentState, IPersistentStateFactory } from '../../../../client/common/types';
import { getNamesAndValues } from '../../../../client/common/utils/enum';
import { OSType } from '../../../../client/common/utils/platform';
import { WindowsRegistryInterpreterSelectionStratergy } from '../../../../client/interpreter/autoSelection/stratergies/windowsRegistry';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { WindowsRegistryService } from '../../../../client/interpreter/locators/services/windowsRegistryService';

const winRegistryPreferredInterpreterPath = 'PreferredInterpreterInWinRegistry';

suite('Interpreters - Auto Selection - Current Path Stratergy', () => {
    getNamesAndValues<OSType>(OSType).forEach(osType => {
        suite(osType.name, () => {
            let stratergy: WindowsRegistryInterpreterSelectionStratergy;
            let helper: IInterpreterHelper;
            let stateFactory: IPersistentStateFactory;
            let state: IPersistentState<PythonInterpreter | undefined>;
            let platformService: IPlatformService;
            let winRegInterperterLocator: IInterpreterLocatorService;

            setup(() => {
                helper = mock(InterpreterHelper);
                stateFactory = mock(PersistentStateFactory);
                platformService = mock(PlatformService);
                winRegInterperterLocator = mock(WindowsRegistryService);
                state = mock<PersistentState<PythonInterpreter | undefined>>(PersistentState);

                when(platformService.osType).thenReturn(osType.value);
                when(platformService.isLinux).thenReturn(osType.value === OSType.Linux);
                when(platformService.isWindows).thenReturn(osType.value === OSType.Windows);
                when(platformService.isMac).thenReturn(osType.value === OSType.OSX);

                when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(winRegistryPreferredInterpreterPath, undefined)).thenReturn(instance(state));

                stratergy = new WindowsRegistryInterpreterSelectionStratergy(instance(helper), instance(platformService), instance(stateFactory), instance(winRegInterperterLocator));
            });

            test('Store is created', () => {
                verify(stateFactory.createGlobalPersistentState(winRegistryPreferredInterpreterPath, undefined)).once();
            });

            [undefined, Uri.parse('one')].forEach(resource => {
                const testSuffix = resource ? ' (without resource)' : ' (with resource)';
                test(`Get Interpreter returns best interpreter from list of interpreters in registry ${testSuffix}`, async () => {
                    const expectedBestInterpreter = 2;
                    const interpreters = [1, expectedBestInterpreter, 3];
                    when(winRegInterperterLocator.getInterpreters(resource)).thenResolve(interpreters as any);
                    when(helper.getBestInterpreter(interpreters as any)).thenReturn(expectedBestInterpreter as any);

                    const bestInterpreter = await stratergy.getInterpreter(resource);

                    verify(stateFactory.createGlobalPersistentState(winRegistryPreferredInterpreterPath, undefined)).once();
                    if (osType.value === OSType.Windows) {
                        verify(winRegInterperterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(interpreters as any)).once();
                        expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter);
                    } else {
                        verify(winRegInterperterLocator.getInterpreters(anything())).never();
                        verify(helper.getBestInterpreter(anything())).never();
                        expect(bestInterpreter as any).to.be.equal(undefined, 'incorrect value');
                    }
                });
                test(`Get Interpreter returns nohting ${testSuffix}`, async () => {
                    when(winRegInterperterLocator.getInterpreters(resource)).thenResolve([]);
                    when(helper.getBestInterpreter(deepEqual([]))).thenReturn(undefined);

                    const bestInterpreter = await stratergy.getInterpreter(resource);

                    verify(stateFactory.createGlobalPersistentState(winRegistryPreferredInterpreterPath, undefined)).once();
                    if (osType.value === OSType.Windows) {
                        verify(winRegInterperterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(deepEqual([]))).once();
                        expect(bestInterpreter as any).to.be.equal(undefined, 'Invalid value');
                    } else {
                        verify(winRegInterperterLocator.getInterpreters(anything())).never();
                        verify(helper.getBestInterpreter(anything())).never();
                        expect(bestInterpreter as any).to.be.equal(undefined, 'incorrect value');
                    }
                });
                test(`Get Stored Interpreter returns stored value ${testSuffix}`, () => {
                    when(state.value).thenReturn('xyz' as any);

                    const value = stratergy.getStoredInterpreter(resource);

                    verify(state.value).once();
                    expect(value as any).to.be.equal('xyz', 'Invalid value');
                });
                test(`Interpreter is stored in state ${testSuffix}`, async () => {
                    const interpreter = 'xyz' as any;
                    when(state.updateValue(interpreter)).thenResolve();

                    await stratergy.storeInterpreter(resource, interpreter);

                    verify(state.updateValue(interpreter)).once();
                });
            });
        });
    });
});
