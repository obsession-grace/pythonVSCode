// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Application } from '../../application';
import { sleep } from '../../helpers';
import { waitForJediOrLSToActivate } from './helper';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Intellisense', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
        });
        it('Activates completely', async () => {
            await waitForJediOrLSToActivate(app);
            await sleep(app.isJedi ? 5000 : 1000);
        });
        it('Go to definition', async () => {
            await app.workbench.quickopen.openFile('definition.py');
            await app.workbench.editor.clickOnTerm('definition.py', 'one()', 6);
            await app.code.dispatchKeybinding('right');
            await app.code.dispatchKeybinding('F12');
            await app.workbench.editor.waitForHighlightingLine('definition.py', 3);
        });
        it('Displays list and completes upon enter', async () => {
            await app.workbench.quickopen.openFile('hello.py');
            await app.code.dispatchKeybinding('down');
            await app.workbench.editor.waitForTypeInEditor('hello.py', 'sys.execu');
            await app.code.dispatchKeybinding('ctrl+space');
            await sleep(100);
            await app.code.dispatchKeybinding('enter');
            await app.workbench.editor.waitForEditorContents('hello.py', contents => contents.indexOf('sys.executable') > -1);
        });
    });
}
