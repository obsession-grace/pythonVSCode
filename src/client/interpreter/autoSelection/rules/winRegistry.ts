// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { IFileSystem, IPlatformService } from '../../../common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../common/types';
import { OSType } from '../../../common/utils/platform';
import { IInterpreterHelper, IInterpreterLocatorService, WINDOWS_REGISTRY_SERVICE } from '../../contracts';
import { AutoSelectionRule, IInterpreterAutoSeletionService } from '../types';
import { BaseRuleService } from './baseRule';

@injectable()
export class WindowsRegistryInterpretersAutoSelectionRule extends BaseRuleService {
    constructor(
        @inject(IFileSystem) fs: IFileSystem,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory,
        @inject(IPlatformService) private readonly platform: IPlatformService,
        @inject(IInterpreterLocatorService) @named(WINDOWS_REGISTRY_SERVICE) private winRegInterpreterLocator: IInterpreterLocatorService) {

        super(AutoSelectionRule.windowsRegistry, fs, stateFactory);
    }
    protected async onAutoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<boolean> {
        if (this.platform.osType !== OSType.Windows) {
            return false;
        }
        const interpreters = await this.winRegInterpreterLocator.getInterpreters(resource);
        const bestInterpreter = this.helper.getBestInterpreter(interpreters);
        return this.setGlobalInterpreter(bestInterpreter, manager);
    }
}
