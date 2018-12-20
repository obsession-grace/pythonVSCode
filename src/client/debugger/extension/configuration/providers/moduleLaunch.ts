// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import { Debug, localize } from '../../../../common/utils/localize';
import { MultiStepInput } from '../../../../common/utils/multiStepInput';
import { DebuggerTypeName } from '../../../constants';
import { LaunchRequestArguments } from '../../../types';
import { DebugConfigurationState, IDebugConfigurationProvider } from '../../types';

@injectable()
export class ModuleLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    public async buildConfiguration(input: MultiStepInput<DebugConfigurationState>, state: DebugConfigurationState) {
        const config: Partial<LaunchRequestArguments> = {
            name: localize('python.snippet.launch.module.label', 'Python: Module')(),
            type: DebuggerTypeName,
            request: 'launch',
            module: 'enter-your-module-name-here'
        };
        const selectedModule = await input.showInputBox({
            title: Debug.moduleEnterModuleTitle(),
            value: config.module || 'enter-your-module-name-here',
            prompt: Debug.moduleEnterModulePrompt(),
            validate: value => Promise.resolve((value && value.trim().length > 0) ? undefined : Debug.moduleEnterModuleInvalidNameError())
        });
        if (selectedModule) {
            config.module = selectedModule;
        }
        Object.assign(state.config, config);
    }
}
