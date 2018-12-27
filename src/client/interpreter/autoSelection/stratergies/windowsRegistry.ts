// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { IPlatformService } from '../../../common/platform/types';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../../common/types';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter, WINDOWS_REGISTRY_SERVICE } from '../../contracts';
import { IBestAvailableInterpreterSelectorStratergy } from '../types';

const winRegistryPreferredInterpreterPath = 'PreferredInterpreterInWinRegistry';

/**
 * Gets the best available interpreter that is avialable in the windows registry.
 * @export
 * @class CurrentPathInterpreterSelectionStratergy
 * @implements {IBestInterpreterSelectorStratergy}
 */
@injectable()
export class WindowsRegistryInterpreterSelectionStratergy implements IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined> {
    public readonly priority = 3;
    private readonly store: IPersistentState<PythonInterpreter | undefined>;
    constructor(@inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPlatformService) private readonly platform: IPlatformService,
        @inject(IPersistentStateFactory) private readonly persistentStateFactory: IPersistentStateFactory,
        @inject(IInterpreterLocatorService) @named(WINDOWS_REGISTRY_SERVICE) private winRegInterpreterLocator: IInterpreterLocatorService) {
        this.store = this.persistentStateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(winRegistryPreferredInterpreterPath, undefined);
    }
    public async getInterpreter(_resource: Resource): Promise<PythonInterpreter | undefined> {
        if (!this.platform.isWindows) {
            return undefined;
        }
        const interpreters = await this.winRegInterpreterLocator.getInterpreters(undefined, true);
        return this.helper.getBestInterpreter(interpreters);
    }
    public getStoredInterpreter(_resource: Resource): PythonInterpreter | undefined {
        return this.store.value;
    }
    public async storeInterpreter(_resource: Resource, interpreter: PythonInterpreter | undefined): Promise<void> {
        await this.store.updateValue(interpreter);
    }
}
