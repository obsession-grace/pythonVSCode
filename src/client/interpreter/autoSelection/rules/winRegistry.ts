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
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        if (this.platform.osType !== OSType.Windows) {
            return this.next(resource, manager);
        }
        const interpreters = await this.winRegInterpreterLocator.getInterpreters(resource);
        const bestInterpreter = this.helper.getBestInterpreter(interpreters);
        if (!await this.setGlobalInterpreter(bestInterpreter, manager)) {
            return this.next(resource, manager);
        }
    }
}
