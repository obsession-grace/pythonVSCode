// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { expect } from 'chai';
import * as path from 'path';
import { PathUtils } from '../../../client/common/platform/pathUtils';
import { initialize, IS_MULTI_ROOT_TEST } from './../../initialize';

const workspace4Path = path.join(__dirname, '..', '..', '..', '..', 'src', 'testMultiRootWkspc', 'workspace4');

suite('PathUtils', () => {
    suiteSetup(async function () {
        if (!IS_MULTI_ROOT_TEST) {
            // tslint:disable-next-line:no-invalid-this
            this.skip();
        }
        await initialize();
    });

    test('PATH variable name should be \'Path\' for windows OS', async () => {
        const pathUtils = new PathUtils(true);
        const pathVariableName = pathUtils.getPathVariableName();

        expect(pathVariableName).to.equal('Path', 'Path variable name is incorrect');
    });

    test('PATH variable name should be \'PATH\' for non-windows OS', async () => {
        const pathUtils = new PathUtils(false);
        const pathVariableName = pathUtils.getPathVariableName();

        expect(pathVariableName).to.equal('PATH', 'Path variable name is incorrect');
    });

    test('fileExists will return false for empty or invalid file names ', async () => {
        const pathUtils = new PathUtils(false);
        await expect(pathUtils.fileExists('')).to.eventually.be.equal(false, 'File exists when passed an empty string');
        // tslint:disable-next-line:no-any
        await expect(pathUtils.fileExists(undefined as any as string)).to.eventually.be.equal(false, 'File exists when passed an undefined value');
    });

    test('fileExists will return true only for files ', async () => {
        const pathUtils = new PathUtils(false);
        const fileName = path.join(workspace4Path, '.env');
        const fileExists = pathUtils.fileExists(fileName);
        const pathExists = pathUtils.pathExists(fileName);

        await expect(fileExists).to.eventually.be.equal(true, 'File does not exist');
        await expect(pathExists).to.eventually.be.equal(false, 'Path exist=true when file name is passed');
    });

    test('pathExists will return false for empty or invalid file names ', async () => {
        const pathUtils = new PathUtils(false);
        await expect(pathUtils.pathExists('')).to.eventually.be.equal(false, 'Path exists when passed an empty string');
        // tslint:disable-next-line:no-any
        await expect(pathUtils.pathExists(undefined as any as string)).to.eventually.be.equal(false, 'Path exists when passed an undefined value');
    });

    test('pathExists will return true only for files ', async () => {
        const pathUtils = new PathUtils(false);
        const pathName = path.join(workspace4Path, '.vscode');
        const fileExists = pathUtils.fileExists(pathName);
        const pathExists = pathUtils.pathExists(pathName);

        await expect(fileExists).to.eventually.be.equal(false, 'File exist=true when path name is passed');
        await expect(pathExists).to.eventually.be.equal(true, 'Path does not exist');
    });
});
