// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:max-classes-per-file

import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri, WorkspaceFolder } from 'vscode';
import { Commands } from '../../common/constants';
import { getIcon } from '../../common/utils/icons';
import { noop } from '../../common/utils/misc';
import { Icons } from '../common/constants';
import { getTestType } from '../common/testUtils';
import { TestFile, TestStatus, TestType } from '../common/types';
import { TestDataItem } from '../types';

export class TestWorkspaceFolder {
    constructor(public readonly workspaceFolder: WorkspaceFolder) { }
    public get resource(): Uri {
        return this.workspaceFolder.uri;
    }
}

export class TestWorkspaceFolderTreeItem extends TreeItem {
    constructor(
        public readonly resource: Uri,
        public readonly data: Readonly<TestWorkspaceFolder>,
        label: string
    ) {
        super(label, TreeItemCollapsibleState.Collapsed);
    }
    public get contextValue(): string {
        return 'workspaceFolder';
    }
    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon {
        return ThemeIcon.Folder;
    }
}

/**
 * Class that represents a visual node on the
 * Test Explorer tree view. Is essentially a wrapper for the underlying
 * TestDataItem.
 */
export class TestTreeItem extends TreeItem {
    public readonly testType: TestType;

    constructor(
        public readonly resource: Uri,
        public readonly data: Readonly<TestDataItem>,
        private readonly parentData: TestWorkspaceFolder | TestDataItem
    ) {
        super(data.name, TreeItemCollapsibleState.Collapsed);
        this.testType = getTestType(this.data);
        this.setCommand();
        if (this.testType === TestType.testFile) {
            this.resourceUri = Uri.file((this.data as TestFile).fullPath);
        }
    }
    public get contextValue(): string {
        return this.testType;
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon {
        if (!this.data) {
            return '';
        }
        const status = this.data.status;
        switch (status) {
            case TestStatus.Error:
            case TestStatus.Fail: {
                return getIcon(Icons.failed);
            }
            case TestStatus.Pass: {
                return getIcon(Icons.passed);
            }
            case TestStatus.Discovering:
            case TestStatus.Running: {
                return getIcon(Icons.discovering);
            }
            case TestStatus.Idle:
            case TestStatus.Unknown: {
                return getIcon(Icons.unknown);
            }
            default: {
                switch (this.testType) {
                    case TestType.testFile: {
                        return ThemeIcon.File;
                    }
                    case TestType.testFolder: {
                        return ThemeIcon.Folder;
                    }
                    default: {
                        return getIcon(Icons.unknown);
                    }
                }
            }
        }
    }
    /**
     * Parent is an extension to the TreeItem, to make it trivial to discover the node's parent.
     */
    public get parent(): TestWorkspaceFolder | TestDataItem {
        return this.parentData;
    }

    public get tooltip(): string {
        if (!this.data) {
            return '';
        }
        if (this.testType !== TestType.testFunction) {
            return `${this.data.functionsFailed} failed, ${this.data.functionsPassed} passed in ${this.data.time} seconds`;
        }
        switch (this.data.status) {
            case TestStatus.Error:
            case TestStatus.Fail: {
                return `Failed in ${this.data.time} seconds`;
            }
            case TestStatus.Pass: {
                return `Passed in ${this.data.time} seconds`;
            }
            case TestStatus.Discovering:
            case TestStatus.Running: {
                return 'Loading...';
            }
            default: {
                return '';
            }
        }
    }

    /**
     * Tooltip for our tree nodes is the test status
     */
    public get testStatus(): string {
        return this.data.status ? this.data.status : TestStatus.Unknown;
    }

    private setCommand() {
        switch (this.testType) {
            case TestType.testFile: {
                this.command = { command: Commands.navigateToTestFile, title: 'Open', arguments: [this.resource, this.data] };
                break;
            }
            case TestType.testFunction: {
                this.command = { command: Commands.navigateToTestFunction, title: 'Open', arguments: [this.resource, this.data, false] };
                break;
            }
            case TestType.testSuite: {
                this.command = { command: Commands.navigateToTestSuite, title: 'Open', arguments: [this.resource, this.data, false] };
                break;
            }
            default: {
                noop();
            }
        }
    }
}

/**
 * Create a TreView node from a given TestDataItem without having to specify the exact test item type.
 *
 * @param resource The workspace resource that this test item exists within.
 * @param testData The data item being represented in this tree view node.
 * @param parent The parent (or undefined, if the item is a root folder) of the test item.
 */
export function createTreeViewItemFrom(resource: Uri, testData: Readonly<TestDataItem>, parent?: TestWorkspaceFolder | TestDataItem): TreeItem {
    return new TestTreeItem(resource, testData, parent!);
}
