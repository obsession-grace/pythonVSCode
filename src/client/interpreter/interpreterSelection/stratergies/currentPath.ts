// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../../common/types';
import { CURRENT_PATH_SERVICE, IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter } from '../../contracts';
import { IBestAvailableInterpreterSelectorStratergy } from '../types';

const globallyPreferredInterpreterPath = 'PreferredInterpreterPathInCurrentPath';

/**
 * Gets the best available interpreter that is accessible from current PATH variable.
 * I.e. if you type `python` or `python3` and we get an interpreter, then those will be returned here.
 * @export
 * @class CurrentPathInterpreterSelectionStratergy
 * @implements {IBestInterpreterSelectorStratergy}
 */
@injectable()
export class CurrentPathInterpreterSelectionStratergy implements IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined> {
    public readonly priority = 4;
    private readonly store: IPersistentState<PythonInterpreter | undefined>;
    constructor(@inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) private readonly persistentStateFactory: IPersistentStateFactory,
        @inject(IInterpreterLocatorService) @named(CURRENT_PATH_SERVICE) private readonly currentPathInterpreterLocator: IInterpreterLocatorService) {
        this.store = this.persistentStateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(globallyPreferredInterpreterPath, undefined);
    }
    public async getInterpreter(_resource: Resource): Promise<PythonInterpreter | undefined> {
        const interpreters = await this.currentPathInterpreterLocator.getInterpreters(undefined, true);
        return this.helper.getBestInterpreter(interpreters);
    }
    public getStoredInterpreter(_resource: Resource): PythonInterpreter | undefined {
        return this.store.value;
    }
    public async storeInterpreter(_resource: Resource, interpreter: PythonInterpreter | undefined): Promise<void> {
        await this.store.updateValue(interpreter);
    }
}
