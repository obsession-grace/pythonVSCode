// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IServiceManager } from '../../ioc/types';
import { ChildProcess } from './childProcess';
import { BufferDecoder } from './decoder';
import { ProcessService } from './proc';
import { IProcessServiceFactory, ProcessServiceFactory } from './processServiceFactory';
import { PythonExecutionFactory } from './pythonExecutionFactory';
import { PythonToolExecutionService } from './pythonToolService';
import { IBufferDecoder, IChildProcess, IProcessService, IPythonExecutionFactory, IPythonToolExecutionService } from './types';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<IBufferDecoder>(IBufferDecoder, BufferDecoder);
    serviceManager.addSingleton<IChildProcess>(IChildProcess, ChildProcess);
    serviceManager.addSingleton<IProcessService>(IProcessService, ProcessService, 'standard');
    serviceManager.addSingleton<IProcessService>(IProcessService, ProcessService, 'wsl');
    serviceManager.addSingleton<IProcessServiceFactory>(IProcessServiceFactory, ProcessServiceFactory);
    serviceManager.addSingleton<IPythonExecutionFactory>(IPythonExecutionFactory, PythonExecutionFactory);
    serviceManager.addSingleton<IPythonToolExecutionService>(IPythonToolExecutionService, PythonToolExecutionService);
}
