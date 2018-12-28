// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any

import { expect } from 'chai';
import { deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { IPersistentState, IPersistentStateFactory } from '../../../../client/common/types';
import { SystemInterpreterSelectionStratergy } from '../../../../client/interpreter/autoSelection/stratergies/system';
import { IInterpreterHelper, IInterpreterService, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { InterpreterService } from '../../../../client/interpreter/interpreterService';

const globallyPreferredInterpreterPath = 'PreferredInterpreterAcrossSystem';

suite('Interpreters - Auto Selection - Current Path Stratergy', () => {
    let stratergy: SystemInterpreterSelectionStratergy;
    let helper: IInterpreterHelper;
    let stateFactory: IPersistentStateFactory;
    let state: IPersistentState<PythonInterpreter | undefined>;
    let interpreterService: IInterpreterService;
    setup(() => {
        helper = mock(InterpreterHelper);
        stateFactory = mock(PersistentStateFactory);
        interpreterService = mock(InterpreterService);
        state = mock<PersistentState<PythonInterpreter | undefined>>(PersistentState);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(globallyPreferredInterpreterPath, undefined)).thenReturn(instance(state));
        stratergy = new SystemInterpreterSelectionStratergy(instance(helper), instance(interpreterService), instance(stateFactory));
    });

    test('Store is created', () => {
        verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
    });
    [undefined, Uri.parse('one')].forEach(resource => {
        const testSuffix = resource ? ' (without resource)' : ' (with resource)';
        test(`Get Interpreter returns best interpreter from list of interpreters in system ${testSuffix}`, async () => {
            const expectedBestInterpreter = 2;
            const interpreters = [1, expectedBestInterpreter, 3];
            when(interpreterService.getInterpreters(resource)).thenResolve(interpreters as any);
            when(helper.getBestInterpreter(interpreters as any)).thenReturn(expectedBestInterpreter as any);

            const bestInterpreter = await stratergy.getInterpreter(resource);

            verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
            verify(interpreterService.getInterpreters(resource)).once();
            verify(helper.getBestInterpreter(interpreters as any)).once();
            expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter);
        });
        test(`Get Interpreter returns nohting ${testSuffix}`, async () => {
            when(interpreterService.getInterpreters(resource)).thenResolve([]);
            when(helper.getBestInterpreter(deepEqual([]))).thenReturn(undefined);

            const bestInterpreter = await stratergy.getInterpreter(resource);

            verify(stateFactory.createGlobalPersistentState(globallyPreferredInterpreterPath, undefined)).once();
            verify(interpreterService.getInterpreters(resource)).once();
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
