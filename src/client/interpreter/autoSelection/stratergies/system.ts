// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../../common/types';
import { IInterpreterHelper, IInterpreterService, PythonInterpreter } from '../../contracts';
import { IBestAvailableInterpreterSelectorStratergy } from '../types';

const globallyPreferredInterpreterPath = 'PreferredInterpreterAcrossSystem';

/**
 * Gets the best available interpreter from all interpreters discovered in the current system.
 * @export
 * @class CurrentPathInterpreterSelectionStratergy
 * @implements {IBestInterpreterSelectorStratergy}
 */
@injectable()
export class SystemInterpreterSelectionStratergy implements IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined> {
    public readonly priority = 2;
    private readonly store: IPersistentState<PythonInterpreter | undefined>;
    constructor(@inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IInterpreterService) private readonly interpreterService: IInterpreterService,
        @inject(IPersistentStateFactory) private readonly persistentStateFactory: IPersistentStateFactory) {
        this.store = this.persistentStateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(globallyPreferredInterpreterPath, undefined);
    }
    public async getInterpreter(resource: Resource): Promise<PythonInterpreter | undefined> {
        const interpreters = await this.interpreterService.getInterpreters(resource);
        return this.helper.getBestInterpreter(interpreters);
    }
    public getStoredInterpreter(_resource: Resource): PythonInterpreter | undefined {
        return this.store.value;
    }
    public async storeInterpreter(_resource: Resource, interpreter: PythonInterpreter | undefined): Promise<void> {
        await this.store.updateValue(interpreter);
    }
}
