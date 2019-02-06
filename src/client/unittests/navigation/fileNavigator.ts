// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { Uri } from 'vscode';
import { captureTelemetry } from '../../telemetry';
import { EventName } from '../../telemetry/constants';
import { TestFile } from '../common/types';
import { ITestCodeNavigator, ITestNavigatorHelper } from './types';

@injectable()
export class TestFileCodeNavigator implements ITestCodeNavigator {
    constructor(@inject(ITestNavigatorHelper) private readonly helper: ITestNavigatorHelper) {}
    @captureTelemetry(EventName.UNITTEST_NAVIGATE_TEST_FILE, undefined, true)
    public async navigateTo(item: TestFile): Promise<void> {
        await this.helper.openFile(item.file ? Uri.file(item.file) : undefined);
    }
}
