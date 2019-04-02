// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IExtensionActivationService } from '../activation/types';
import { ILaunchJsonUpdaterService } from '../debugger/extension/configuration/types';
import { ICommandManager } from './application/types';
import { IDisposableRegistry, Resource } from './types';

@injectable()
export class CommandRegistry implements IExtensionActivationService {
    constructor(@inject(IDisposableRegistry) private readonly disposableRegistry: IDisposableRegistry,
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(ILaunchJsonUpdaterService) private readonly commandHandler: ILaunchJsonUpdaterService) { }
    public async activate(_resource: Resource): Promise<void> {
        this.disposableRegistry.push(this.commandManager.registerCommand('python.SelectAndInsertDebugConfiguration', this.commandHandler.selectAndInsertDebugConfig, this.commandHandler));
    }
}
