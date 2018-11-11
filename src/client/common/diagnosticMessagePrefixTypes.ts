// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { DiagnosticMessagePrefixes, TestStatus } from '../unittests/common/types';

// tslint:disable-next-line:variable-name
export const DiagnosticMessagePrefixTypes = new Map<TestStatus, string>();
DiagnosticMessagePrefixTypes.set(TestStatus.Fail, DiagnosticMessagePrefixes.Failure);
DiagnosticMessagePrefixTypes.set(TestStatus.Error, DiagnosticMessagePrefixes.Error);
DiagnosticMessagePrefixTypes.set(TestStatus.Skipped, DiagnosticMessagePrefixes.Skipped);
