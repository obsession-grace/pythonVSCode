// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import { DiagnosticSeverity } from 'vscode';
import * as localize from '../../../common/utils/localize';
import { DiagnosticMessageType, IUnitTestDiagnosticService, PythonUnitTestMessageSeverity } from '../../types';
import { TestStatus } from '../types';

@injectable()
export class UnitTestDiagnosticService implements IUnitTestDiagnosticService {
    private MessageTypes = new Map<TestStatus, DiagnosticMessageType>();
    private MessageSeverities = new Map<PythonUnitTestMessageSeverity, DiagnosticSeverity>();

    constructor() {
        this.MessageTypes.set(TestStatus.Error, DiagnosticMessageType.Error);
        this.MessageTypes.set(TestStatus.Fail, DiagnosticMessageType.Fail);
        this.MessageTypes.set(TestStatus.Skipped, DiagnosticMessageType.Skipped);
        this.MessageSeverities.set(PythonUnitTestMessageSeverity.Error, DiagnosticSeverity.Error);
        this.MessageSeverities.set(PythonUnitTestMessageSeverity.Failure, DiagnosticSeverity.Error);
        this.MessageSeverities.set(PythonUnitTestMessageSeverity.Skip, DiagnosticSeverity.Information);
    }
    public getMessagePrefix(status: TestStatus): string {
        switch (this.MessageTypes.get(status)!) {
            case DiagnosticMessageType.Error:
                return localize.UnitTests.testErrorDiagnosticMessage();
            case DiagnosticMessageType.Fail:
                return localize.UnitTests.testFailDiagnosticMessage();
            case DiagnosticMessageType.Skipped:
                return localize.UnitTests.testSkippedDiagnosticMessage();
            default:
                break;
        }
    }
    public getSeverity(unitTestSeverity: PythonUnitTestMessageSeverity): DiagnosticSeverity {
        return this.MessageSeverities.get(unitTestSeverity)!;
    }
}
