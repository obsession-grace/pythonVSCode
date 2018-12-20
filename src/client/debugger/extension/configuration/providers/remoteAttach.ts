// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import { Debug, localize } from '../../../../common/utils/localize';
import { InputStep, MultiStepInput } from '../../../../common/utils/multiStepInput';
import { DebuggerTypeName } from '../../../constants';
import { AttachRequestArguments } from '../../../types';
import { DebugConfigurationState, IDebugConfigurationProvider } from '../../types';

@injectable()
export class RemoteAttachDebugConfigurationProvider implements IDebugConfigurationProvider {
    public async buildConfiguration(input: MultiStepInput<DebugConfigurationState>, state: DebugConfigurationState): Promise<InputStep<DebugConfigurationState> | void> {
        const config: Partial<AttachRequestArguments> = {
            name: localize('python.snippet.launch.attach.label', 'Python: Attach')(),
            type: DebuggerTypeName,
            request: 'attach',
            port: 5678,
            host: 'localhost'
        };

        config.host = await input.showInputBox({
            title: Debug.attachRemoteHostTitle(),
            step: 1,
            totalSteps: 2,
            value: config.host || 'localhost',
            prompt: Debug.attachRemoteHostPrompt(),
            validate: value => Promise.resolve((value && value.trim().length > 0) ? undefined : Debug.attachRemoteHostValidationError())
        });
        if (!config.host) {
            config.host = 'localhost';
        }

        Object.assign(state.config, config);
        return _ => this.configurePort(input, state.config);
    }
    protected async configurePort(input: MultiStepInput<DebugConfigurationState>, config: Partial<AttachRequestArguments>) {
        const port = await input.showInputBox({
            title: Debug.attachRemotePortTitle(),
            step: 2,
            totalSteps: 2,
            value: (config.port || 5678).toString(),
            prompt: Debug.attachRemotePortPrompt(),
            validate: value => Promise.resolve((value && /^\d+$/.test(value.trim())) ? undefined : Debug.attachRemotePortValidationError())
        });
        if (port && /^\d+$/.test(port.trim())) {
            config.port = parseInt(port, 10);
        }
        if (!config.port) {
            config.port = 5678;
        }
    }
}
