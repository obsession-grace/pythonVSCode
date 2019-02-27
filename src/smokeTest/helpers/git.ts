// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as cp from 'child_process';
export async function resetWorkspace(workspacePath: string): Promise<void> {
    cp.spawnSync('git', ['fetch'], { cwd: workspacePath });
    cp.spawnSync('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: workspacePath });
    cp.spawnSync('git', ['clean', '-xdf'], { cwd: workspacePath });
}
