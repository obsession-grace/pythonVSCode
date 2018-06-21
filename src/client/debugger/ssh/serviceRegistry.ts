
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { IServiceManager } from '../../ioc/types';
import { IDebugConfigurationProvider } from '../types';
import { SshConnections, ISshConnections, ISshTunnelService, SshTunnelService } from './connection';
import { ConnectionDebugConfigurationProvider } from './connectionDebugProvider';
import { DebugConfigurationProvider } from 'vscode';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<ISshConnections>(ISshConnections, SshConnections);
    serviceManager.addSingleton<ISshTunnelService>(ISshTunnelService, SshTunnelService);
    // serviceManager.addSingleton<DebugConfigurationProvider>(IDebugConfigurationProvider, ConnectionDebugConfigurationProvider);
}
