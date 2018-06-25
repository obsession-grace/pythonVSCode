
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { DebugConfigurationProvider } from 'vscode';
import { IServiceManager } from '../../ioc/types';
import { IDebugConfigurationProvider } from '../types';
import { ISshConnections, ISshTunnelService, SshConnections, SshTunnelService } from './connection';
import { ConnectionDebugConfigurationProvider } from './connectionDebugProvider';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<ISshConnections>(ISshConnections, SshConnections);
    serviceManager.addSingleton<ISshTunnelService>(ISshTunnelService, SshTunnelService);
    serviceManager.addSingleton<DebugConfigurationProvider>(IDebugConfigurationProvider, ConnectionDebugConfigurationProvider);
}
