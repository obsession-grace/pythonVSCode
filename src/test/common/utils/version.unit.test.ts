// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable: no-any

import * as assert from 'assert';
import { compareVersion, convertPythonVersionToSemver, convertToSemver } from '../../../client/common/utils/version';

suite('Version Utils', () => {
    test('Must handle invalid versions', async () => {
        const version = 'ABC';
        assert.equal(convertToSemver(version), `${version}.0.0`, 'Version is incorrect');
    });
    test('Must handle null, empty and undefined', async () => {
        assert.equal(convertToSemver(''), '0.0.0', 'Version is incorrect for empty string');
        assert.equal(convertToSemver(<any>null), '0.0.0', 'Version is incorrect for null value');
        assert.equal(convertToSemver(<any>undefined), '0.0.0', 'Version is incorrect for undefined value');
    });
    test('Must be able to compare versions correctly', async () => {
        assert.equal(compareVersion('', '1'), 0, '1. Comparison failed');
        assert.equal(compareVersion('1', '0.1'), 1, '2. Comparison failed');
        assert.equal(compareVersion('2.10', '2.9'), 1, '3. Comparison failed');
        assert.equal(compareVersion('2.99.9', '3'), 0, '4. Comparison failed');
    });
    test('Must convert undefined if empty strinfg', async () => {
        assert.equal(convertPythonVersionToSemver(undefined as any), undefined);
        assert.equal(convertPythonVersionToSemver(''), undefined);
    });
    test('Must convert version correctly', async () => {
        const version = convertPythonVersionToSemver('3.7.1')!;
        assert.equal(version.raw, '3.7.1');
        assert.equal(version.major, 3);
        assert.equal(version.minor, 7);
        assert.equal(version.patch, 1);
        assert.deepEqual(version.prerelease, []);
    });
    test('Must convert version correctly with pre-release', async () => {
        const version = convertPythonVersionToSemver('3.7.1-alpha')!;
        assert.equal(version.raw, '3.7.1-alpha');
        assert.equal(version.major, 3);
        assert.equal(version.minor, 7);
        assert.equal(version.patch, 1);
        assert.deepEqual(version.prerelease, ['alpha']);
    });
    test('Must remove invalid pre-release channels', async () => {
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-alpha')!.prerelease, ['alpha']);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-beta')!.prerelease, ['beta']);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-candidate')!.prerelease, ['candidate']);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-final')!.prerelease, ['final']);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-unknown')!.prerelease, []);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-')!.prerelease, []);
        assert.deepEqual(convertPythonVersionToSemver('3.7.1-prerelease')!.prerelease, []);
    });
    test('Must default versions partgs to 0 if they are not numeric', async () => {
        assert.deepEqual(convertPythonVersionToSemver('3.B.1')!.raw, '3.0.1');
        assert.deepEqual(convertPythonVersionToSemver('3.B.C')!.raw, '3.0.0');
        assert.deepEqual(convertPythonVersionToSemver('A.B.C')!.raw, '0.0.0');
    });
});
