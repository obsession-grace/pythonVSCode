// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { CancellationToken, QuickPickItem, QuickPickOptions, WorkspaceFolder } from 'vscode';
import { IApplicationShell } from '../../../../common/application/types';
import { Debug } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationPicker } from '../../types';

type OptionItem = QuickPickItem & { type: DebugConfigurationType };
@injectable()
export class DebugConfigurationPicker implements IDebugConfigurationPicker {
    constructor(@inject(IApplicationShell) private readonly shell: IApplicationShell) { }

    public async getSelectedConfiguration(_folder: WorkspaceFolder | undefined, token?: CancellationToken): Promise<DebugConfigurationType | undefined> {
        const items: OptionItem[] = [
            { label: Debug.debugFileConfigurationLabel(), type: DebugConfigurationType.launchFile, description: 'hello there', detail: 'details' },
            { label: Debug.attachConfigurationLabel(), type: DebugConfigurationType.remoteAttach, description: 'hello there', detail: 'details' },
            { label: Debug.debugDjangoConfigurationLabel(), type: DebugConfigurationType.launchDjango, description: 'hello there', detail: 'details' },
            { label: Debug.debugFlaskConfigurationLabel(), type: DebugConfigurationType.launchFlask, description: 'hello there', detail: 'details' },
            { label: 'Module', type: DebugConfigurationType.launchFlask, description: 'Debug Python module/package', detail: 'Debug a python module invoking it with `-m`' }
        ];
        const options: QuickPickOptions = { ignoreFocusOut: true, matchOnDescription: true, matchOnDetail: true, placeHolder: Debug.selectConfiguration() };
        const selection = await this.shell.showQuickPick(items, options, token);
        return selection ? selection.type : undefined;
    }
}
