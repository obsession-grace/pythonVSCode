// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any

import { expect } from 'chai';
import { deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { IPersistentState, IPersistentStateFactory } from '../../../../client/common/types';
import { CurrentPathInterpreterSelectionStratergy } from '../../../../client/interpreter/autoSelection/stratergies/currentPath';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { CurrentPathService } from '../../../../client/interpreter/locators/services/currentPathService';

const globallyPreferredInterpreterPath = 'PreferredInterpreterPathInCurrentPath';

suite('Interpreters - Auto Selection - Current Path Stratergy', () => {
    let stratergy: CurrentPathInterpreterSelectionStratergy;
    let helper: IInterpreterHelper;
    let stateFactory: IPersistentStateFactory;
    let state: IPersistentState<PythonInterpreter | undefined>;
    let currentPathInterpreterLocator: IInterpreterLocatorService;
    setup(() => {
        helper = mock(InterpreterHelper);
        stateFactory = mock(PersistentStateFactory);
        state = mock<PersistentState<PythonInterpreter | undefined>>(PersistentState);
        currentPathInterpreterLocator = mock(CurrentPathService);

        when(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).thenReturn(instance(state) as any);
        stratergy = new CurrentPathInterpreterSelectionStratergy(instance(helper), instance(stateFactory), instance(currentPathInterpreterLocator));
    });

    test('Store is created', () => {
        verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
    });
    [undefined, Uri.parse('one')].forEach(resource => {
        const testSuffix = resource ? ' (without resource)' : ' (with resource)';
        test(`Get Interpreter returns best interpreter from list of interpreters in current path ${testSuffix}`, async () => {
            const expectedBestInterpreter = 2;
            const interpreters = [1, expectedBestInterpreter, 3];
            when(currentPathInterpreterLocator.getInterpreters(resource)).thenResolve(interpreters as any);
            when(helper.getBestInterpreter(interpreters as any)).thenReturn(expectedBestInterpreter as any);

            const bestInterpreter = await stratergy.getInterpreter(resource);

            verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
            verify(currentPathInterpreterLocator.getInterpreters(resource)).once();
            verify(helper.getBestInterpreter(interpreters as any)).once();
            expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter);
        });
        test(`Get Interpreter returns nohting ${testSuffix}`, async () => {
            when(currentPathInterpreterLocator.getInterpreters(resource)).thenResolve([]);
            when(helper.getBestInterpreter(deepEqual([]))).thenReturn(undefined);

            const bestInterpreter = await stratergy.getInterpreter(resource);

            verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
            verify(currentPathInterpreterLocator.getInterpreters(resource)).once();
            verify(helper.getBestInterpreter(deepEqual([]))).once();
            expect(bestInterpreter as any).to.be.equal(undefined, 'Invalid value');
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
