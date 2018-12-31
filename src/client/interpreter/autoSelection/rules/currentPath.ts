// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { CURRENT_PATH_SERVICE, IInterpreterHelper, IInterpreterLocatorService } from '../../contracts';
import { AutoSelectionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class CurrentPathInterpretersAutoSelectionRule extends BaseRuleService {
    constructor(
        @inject(IFileSystem) fs: IFileSystem,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IInterpreterLocatorService) @named(CURRENT_PATH_SERVICE) private readonly currentPathInterpreterLocator: IInterpreterLocatorService) {

        super(AutoSelectionRule.currentPath, fs, stateFactory);
    }
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        await super.autoSelectInterpreter(resource, manager);
        const interpreters = await this.currentPathInterpreterLocator.getInterpreters(resource);
        const bestInterpreter = this.helper.getBestInterpreter(interpreters);
        if (!await this.setGlobalInterpreter(bestInterpreter, manager)) {
            return this.next(resource, manager);
        }
    }
}
