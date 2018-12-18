// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { IServiceManager } from '../../ioc/types';
import { AttachRequestArguments, LaunchRequestArguments } from '../types';
import { DebuggerBanner } from './banner';
import { ConfigurationProviderUtils } from './configuration/configurationProviderUtils';
import { PythonDebugConfigurationService } from './configuration/debugConfigurationService';
import { DjangoLaunchDebugConfigurationProvider } from './configuration/providers/djangoLaunch';
import { FileLaunchDebugConfigurationProvider } from './configuration/providers/fileLaunch';
import { FlaskLaunchDebugConfigurationProvider } from './configuration/providers/flaskLaunch';
import { ModuleLaunchDebugConfigurationProvider } from './configuration/providers/moduleLaunch';
import { DebugConfigurationPicker } from './configuration/providers/picker';
import { AttachDebugConfigurationProvider } from './configuration/providers/remoteAttach';
import { AttachConfigurationResolver } from './configuration/resolvers/attach';
import { LaunchConfigurationResolver } from './configuration/resolvers/launch';
import { IConfigurationProviderUtils, IDebugConfigurationResolver } from './configuration/types';
import { ChildProcessAttachEventHandler } from './hooks/childProcessAttachHandler';
import { ChildProcessAttachService } from './hooks/childProcessAttachService';
import { IChildProcessAttachService, IDebugSessionEventHandlers } from './hooks/types';
import { IDebugConfigurationPicker, IDebugConfigurationProvider, IDebugConfigurationService, IDebuggerBanner } from './types';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<IDebugConfigurationService>(IDebugConfigurationService, PythonDebugConfigurationService);
    serviceManager.addSingleton<IConfigurationProviderUtils>(IConfigurationProviderUtils, ConfigurationProviderUtils);
    serviceManager.addSingleton<IDebuggerBanner>(IDebuggerBanner, DebuggerBanner);
    serviceManager.addSingleton<IChildProcessAttachService>(IChildProcessAttachService, ChildProcessAttachService);
    serviceManager.addSingleton<IDebugSessionEventHandlers>(IDebugSessionEventHandlers, ChildProcessAttachEventHandler);
    serviceManager.addSingleton<IDebugConfigurationResolver<LaunchRequestArguments>>(IDebugConfigurationResolver, LaunchConfigurationResolver, 'launch');
    serviceManager.addSingleton<IDebugConfigurationResolver<AttachRequestArguments>>(IDebugConfigurationResolver, AttachConfigurationResolver, 'attach');
    serviceManager.addSingleton<IDebugConfigurationPicker>(IDebugConfigurationPicker, DebugConfigurationPicker);
    serviceManager.addSingleton<IDebugConfigurationProvider>(IDebugConfigurationProvider, FileLaunchDebugConfigurationProvider);
    serviceManager.addSingleton<IDebugConfigurationProvider>(IDebugConfigurationProvider, DjangoLaunchDebugConfigurationProvider);
    serviceManager.addSingleton<IDebugConfigurationProvider>(IDebugConfigurationProvider, FlaskLaunchDebugConfigurationProvider);
    serviceManager.addSingleton<IDebugConfigurationProvider>(IDebugConfigurationProvider, AttachDebugConfigurationProvider);
    serviceManager.addSingleton<IDebugConfigurationProvider>(IDebugConfigurationProvider, ModuleLaunchDebugConfigurationProvider);
}
