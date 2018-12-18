// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, multiInject, named } from 'inversify';
import { CancellationToken, DebugConfiguration, WorkspaceFolder } from 'vscode';
import { AttachRequestArguments, LaunchRequestArguments } from '../../types';
import { IDebugConfigurationPicker, IDebugConfigurationProvider, IDebugConfigurationService } from '../types';
import { IDebugConfigurationResolver } from './types';

@injectable()
export class PythonDebugConfigurationService implements IDebugConfigurationService {
    constructor(@inject(IDebugConfigurationResolver) @named('attach') private readonly attachResolver: IDebugConfigurationResolver<AttachRequestArguments>,
        @inject(IDebugConfigurationResolver) @named('launch') private readonly launchResolver: IDebugConfigurationResolver<LaunchRequestArguments>,
        @inject(IDebugConfigurationPicker) private readonly picker: IDebugConfigurationPicker,
        @multiInject(IDebugConfigurationProvider) private readonly providers: IDebugConfigurationProvider[]) {
    }
    public async provideDebugConfigurations?(folder: WorkspaceFolder | undefined, token?: CancellationToken): Promise<DebugConfiguration[] | undefined> {
        const debugConfigType = await this.picker.getSelectedConfiguration(folder, token);
        if (!debugConfigType) {
            return;
        }
        const providers = this.providers.filter(p => p.isSupported(debugConfigType));
        if (providers.length === 0) {
            return;
        }

        const configs = await Promise.all(providers.map(provider => provider.provideDebugConfigurations(folder, token)));
        // tslint:disable-next-line:no-require-imports no-var-requires
        const flatten = require('lodash/flatten') as typeof import('lodash/flatten');
        return flatten(configs.filter(item => Array.isArray(item)).map(item => item!));
    }
    public async resolveDebugConfiguration(folder: WorkspaceFolder | undefined, debugConfiguration: DebugConfiguration, token?: CancellationToken): Promise<DebugConfiguration | undefined> {
        if (debugConfiguration.request === 'attach') {
            return this.attachResolver.resolveDebugConfiguration(folder, debugConfiguration as AttachRequestArguments, token);
        } else {
            return this.launchResolver.resolveDebugConfiguration(folder, debugConfiguration as LaunchRequestArguments, token);
        }
    }
}
