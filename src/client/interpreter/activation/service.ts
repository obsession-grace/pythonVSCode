// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { LogOptions, traceDecorators, traceVerbose } from '../../common/logger';
import { IPlatformService } from '../../common/platform/types';
import { IProcessServiceFactory } from '../../common/process/types';
import { ITerminalHelper } from '../../common/terminal/types';
import { ICurrentProcess, IDisposable, Resource } from '../../common/types';
import { cacheResourceSpecificIngterpreterData, clearCachedResourceSpecificIngterpreterData, swallowExceptions } from '../../common/utils/decorators';
import { OSType } from '../../common/utils/platform';
import { IEnvironmentVariablesProvider } from '../../common/variables/types';
import { IEnvironmentActivationService } from './types';

const getEnvironmentPrefix = 'e8b39361-0157-4923-80e1-22d70d46dee6';

// Regex for splitting environment strings
const environmentSplitRegex = /^\s*([^=]+)\s*=\s*(.+)\s*$/;
const cacheDuration = 10 * 60 * 1000;

// The shell under which we'll execute activation scripts.
const defaultShells = {
    [OSType.Windows]: 'cmd',
    [OSType.OSX]: 'bash',
    [OSType.Linux]: 'bash',
    [OSType.Unknown]: undefined
};

@injectable()
export class EnvironmentActivationService implements IEnvironmentActivationService, IDisposable {
    private readonly disposables: IDisposable[] = [];
    constructor(@inject(ITerminalHelper) private readonly helper: ITerminalHelper,
        @inject(IPlatformService) private readonly platform: IPlatformService,
        @inject(IProcessServiceFactory) private processServiceFactory: IProcessServiceFactory,
        @inject(ICurrentProcess) private currentProcess: ICurrentProcess,
        @inject(IEnvironmentVariablesProvider) private readonly envVarsService: IEnvironmentVariablesProvider) {

        this.envVarsService.onDidEnvironmentVariablesChange(this.onDidEnvironmentVariablesChange, this, this.disposables);
    }

    public dispose(): void | Promise<void> {
        this.disposables.forEach(d => d.dispose());
    }
    @traceDecorators.verbose('getActivatedEnvironmentVariables', LogOptions.Arguments)
    @swallowExceptions('getActivatedEnvironmentVariables')
    @cacheResourceSpecificIngterpreterData('ActivatedEnvironmentVariables', cacheDuration)
    public async getActivatedEnvironmentVariables(resource: Resource): Promise<NodeJS.ProcessEnv | undefined> {
        const shell = defaultShells[this.platform.osType];
        if (!shell) {
            return;
        }

        const activationCommands = await this.helper.getEnvironmentActivationShellCommands(resource);
        traceVerbose(`Activation Commands received ${activationCommands}`);
        if (!activationCommands || !Array.isArray(activationCommands) || activationCommands.length === 0) {
            return;
        }

        // Run the activate command collect the environment from it.
        const listEnv = this.platform.isWindows ? 'set' : 'printenv';
        const activationCommand = this.fixActivationCommands(activationCommands).join(' && ');
        const processService = await this.processServiceFactory.create(resource);

        const customEnvVars = await this.envVarsService.getEnvironmentVariables(resource);
        const hasCustomEnvVars = Object.keys(customEnvVars).length;
        const env = hasCustomEnvVars ? this.currentProcess.env : customEnvVars;
        traceVerbose(`${hasCustomEnvVars ? 'Has' : 'No'} Custom Env Vars`);

        // In order to make sure we know where the environment output is,
        // put in a dummy echo we can look for
        const command = `${activationCommand} && echo '${getEnvironmentPrefix}' && ${listEnv}`;
        traceVerbose(`Activating Environment to capture Environment variables, ${command}`);
        const result = await processService.shellExec(command, { env, shell });
        if (result.stderr && result.stderr.length > 0) {
            throw new Error(`StdErr from ShellExec, ${result.stderr}`);
        }
        return this.parseEnvironmentOutput(result.stdout);
    }
    protected onDidEnvironmentVariablesChange(affectedResource: Resource) {
        clearCachedResourceSpecificIngterpreterData('ActivatedEnvironmentVariables', affectedResource);
    }
    protected fixActivationCommands(commands: string[]): string[] {
        // Replace 'source ' with '. ' as that works in shell exec
        return commands.map(cmd => cmd.replace(/^source\s+/, '. '));
    }
    @traceDecorators.verbose('parseEnvironmentOutput', LogOptions.None)
    protected parseEnvironmentOutput(output: string): NodeJS.ProcessEnv | undefined {
        const result = {};
        const lines = output.splitLines({ trim: true, removeEmptyEntries: true });
        let foundDummyOutput = false;
        for (let i = 0; i < lines.length; i += 1) {
            if (foundDummyOutput) {
                // Split on equal
                const match = environmentSplitRegex.exec(lines[i]);
                if (match && match !== null && match.length > 2) {
                    result[match[1]] = match[2];
                }
            } else {
                // See if we found the dummy output or not yet
                foundDummyOutput = lines[i].includes(getEnvironmentPrefix);
            }
        }

        return Object.keys(result).length === 0 ? undefined : result;
    }
}
