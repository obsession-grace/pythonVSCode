// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { IInterpreterHelper } from '../../contracts';
import { AutoSelectionRule, IInterpreterAutoSeletionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class CachedInterpretersAutoSelectionRule extends BaseRuleService {
    protected readonly rules: IInterpreterAutoSeletionRule[];
    constructor(@inject(IFileSystem) fs: IFileSystem,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IInterpreterAutoSeletionRule) @named(AutoSelectionRule.systemWide) systemInterpreter: IInterpreterAutoSeletionRule,
        @inject(IInterpreterAutoSeletionRule) @named(AutoSelectionRule.currentPath) currentPathInterpreter: IInterpreterAutoSeletionRule,
        @inject(IInterpreterAutoSeletionRule) @named(AutoSelectionRule.windowsRegistry) winRegInterpreter: IInterpreterAutoSeletionRule) {

        super(AutoSelectionRule.cachedInterpreters, fs, stateFactory);
        this.rules = [systemInterpreter, currentPathInterpreter, winRegInterpreter];
    }
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        const cachedInterpreters = this.rules
            .map(item => item.getPreviouslyAutoSelectedInterpreter(resource))
            .filter(item => !!item)
            .map(item => item!);
        const bestInterpreter = this.helper.getBestInterpreter(cachedInterpreters);
        if (! await this.setGlobalInterpreter(bestInterpreter, manager)) {
            return this.next(resource, manager);
        }
    }
}
