// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IWorkspaceService } from '../../../common/application/types';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { AutoSelectionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class SettingsInterpretersAutoSelectionRule extends BaseRuleService {
    constructor(
        @inject(IFileSystem) fs: IFileSystem,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService) {

        super(AutoSelectionRule.settings, fs, stateFactory);
    }
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        await super.autoSelectInterpreter(resource, manager);
        // tslint:disable-next-line:no-any
        const pythonConfig = this.workspaceService.getConfiguration('python', null as any)!;
        const pythonPathInConfig = pythonConfig.inspect<string>('pythonPath')!;
        // No need to store python paths defined in settings in our caches, they can be retrieved from the settings directly.
        if (pythonPathInConfig.globalValue && pythonPathInConfig.globalValue !== 'python') {
            return;
        }
        return this.next(resource, manager);
    }
}
