// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IWorkspaceService } from '../../../common/application/types';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { IInterpreterHelper } from '../../contracts';
import { AutoSelectionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class SettingsInterpretersAutoSelectionRule extends BaseRuleService {
    constructor(
        @inject(IFileSystem) fs: IFileSystem,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService) {

        super(AutoSelectionRule.settings, fs, stateFactory);
    }
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        if (!this.helper.getActiveWorkspaceUri(resource)) {
            return this.next(resource, manager);
        }
        const pythonConfig = this.workspaceService.getConfiguration('python', resource)!;
        const pythonPathInConfig = pythonConfig.inspect<string>('pythonPath')!;
        // No need to store python paths defined in settings in our caches, they can be retrieved from the settings directly.
        if (pythonPathInConfig.globalValue && pythonPathInConfig.globalValue !== 'python' && manager) {
            return;
        }
        return this.next(resource, manager);
    }
}
