// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { IInterpreterHelper, IInterpreterService } from '../../contracts';
import { AutoSelectionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class SystemWideInterpretersAutoSelectionRule extends BaseRuleService {
    constructor(
        @inject(IFileSystem) fs: IFileSystem,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IInterpreterService) private readonly interpreterService: IInterpreterService) {

        super(AutoSelectionRule.systemWide, fs, stateFactory);
    }
    protected async onAutoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<boolean> {
        const interpreters = await this.interpreterService.getInterpreters(resource);
        const bestInterpreter = this.helper.getBestInterpreter(interpreters);
        return this.setGlobalInterpreter(bestInterpreter, manager);
    }
}
