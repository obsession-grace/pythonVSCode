// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

export interface IElement {
    tagName: string;
    className: string;
    textContent: string;
    attributes: { [name: string]: string; };
    children: IElement[];
    top: number;
    left: number;
}

export interface IDriver {
    _serviceBrand: any;

    getWindowIds(): Promise<number[]>;
    capturePage(windowId: number): Promise<string>;
    reloadWindow(windowId: number): Promise<void>;
    exitApplication(): Promise<void>;
    dispatchKeybinding(windowId: number, keybinding: string): Promise<void>;
    click(windowId: number, selector: string, xoffset?: number | undefined, yoffset?: number | undefined): Promise<void>;
    doubleClick(windowId: number, selector: string): Promise<void>;
    setValue(windowId: number, selector: string, text: string): Promise<void>;
    getTitle(windowId: number): Promise<string>;
    isActiveElement(windowId: number, selector: string): Promise<boolean>;
    getElements(windowId: number, selector: string, recursive?: boolean): Promise<IElement[]>;
    typeInEditor(windowId: number, selector: string, text: string): Promise<void>;
    getTerminalBuffer(windowId: number, selector: string): Promise<string[]>;
    writeInTerminal(windowId: number, selector: string, text: string): Promise<void>;
}

export interface IDisposable {
    dispose(): void;
}

import * as path from 'path';

export function connect(outPath: string, handle: string): Promise<{ client: IDisposable, driver: IDriver }> {
    // const bootstrapPath = path.join(outPath, 'bootstrap-amd.js');
    // const { load } = require(bootstrapPath);
    // return new Promise((c, e) => load('vs/platform/driver/node/driver', ({ connect }) => connect(handle).then(c, e), e));

    const bootstrapPath = path.join(outPath, 'bootstrap-amd.js');
    // tslint:disable-next-line:non-literal-require
    const { load } = require(bootstrapPath);
    // console.log(`Here is bootstrapPath ${bootstrapPath}`);
    // console.log(`Here is outPath ${outPath}`);
    // console.log(`Here is handle ${handle}`);
    // console.log(`Here is load ${load}`);
    return new Promise((c, reject) => {
        return load(
            'vs/platform/driver/node/driver',
            // tslint:disable-next-line:no-shadowed-variable
            ({ connect }) => {
                return connect(handle).then(c, ex => {
                    // console.error('Failed1=========================================================================');
                    // console.error(ex);
                    // console.error('Failed1=========================================================================');
                    reject(ex);
                });
            },
            ex => {
                // console.error('Failed2=========================================================================');
                // console.error(ex);
                // console.error('Failed2=========================================================================');
                reject(ex);
            }
        );
    });
};
