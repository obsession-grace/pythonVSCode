// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { Event, EventEmitter, TreeItem, Uri } from 'vscode';
import { IWorkspaceService } from '../../common/application/types';
import { IDisposable, IDisposableRegistry } from '../../common/types';
import { getChildren, getParent } from '../common/testUtils';
import { ITestCollectionStorageService, TestStatus } from '../common/types';
import { ITestDataItemResource, ITestTreeViewProvider, IUnitTestManagementService, TestDataItem, WorkspaceTestStatus } from '../types';
import { createTreeViewItemFrom, TestWorkspaceFolder, TestWorkspaceFolderTreeItem } from './testTreeViewItem';

@injectable()
export class TestTreeViewProvider implements ITestTreeViewProvider<TestWorkspaceFolder | TestDataItem>, ITestDataItemResource, IDisposable {
    public readonly onDidChangeTreeData: Event<TestWorkspaceFolder | TestDataItem | undefined>;
    public readonly testsAreBeingDiscovered: Map<string, boolean>;

    private _onDidChangeTreeData = new EventEmitter<TestWorkspaceFolder | TestDataItem | undefined>();
    private disposables: IDisposable[] = [];

    constructor(
        @inject(ITestCollectionStorageService) private testStore: ITestCollectionStorageService,
        @inject(IUnitTestManagementService) private testService: IUnitTestManagementService,
        @inject(IWorkspaceService) private readonly workspace: IWorkspaceService,
        @inject(IDisposableRegistry) disposableRegistry: IDisposableRegistry
    ) {
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        disposableRegistry.push(this);
        this.testsAreBeingDiscovered = new Map<string, boolean>();
        this.disposables.push(this.testService.onDidStatusChange(this.onTestStatusChanged, this));
        this.testStore.onDidChange(e => this._onDidChangeTreeData.fire(e.data), this, this.disposables);

        if (Array.isArray(workspace.workspaceFolders) && workspace.workspaceFolders.length > 0) {
            this.refresh(workspace.workspaceFolders[0].uri);
        }
    }

    /**
     * We need a way to map a given TestDataItem to a Uri, so that other consumers (such
     * as the commandHandler for the Test Explorer) have a way of accessing the Uri outside
     * the purview off the TestTreeView.
     *
     * @param testData Test data item to map to a Uri
     * @returns A Uri representing the workspace that the test data item exists within
     */
    public getResource(testData: Readonly<TestWorkspaceFolder | TestDataItem>): Uri {
        return testData.resource;
    }

    /**
     * As the TreeViewProvider itself is getting disposed, ensure all registered listeners are disposed
     * from our internal emitter.
     */
    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onDidChangeTreeData.dispose();
    }

    /**
     * Get [TreeItem](#TreeItem) representation of the `element`
     *
     * @param element The element for which [TreeItem](#TreeItem) representation is asked for.
     * @return [TreeItem](#TreeItem) representation of the element
     */
    public async getTreeItem(element: TestWorkspaceFolder | TestDataItem): Promise<TreeItem> {
        if (element instanceof TestWorkspaceFolder) {
            return new TestWorkspaceFolderTreeItem(element.resource, element, element.workspaceFolder.name);
        }
        const parent = await this.getParent!(element);
        return createTreeViewItemFrom(element.resource, element, parent);
    }

    /**
     * Get the children of `element` or root if no element is passed.
     *
     * @param element The element from which the provider gets children. Can be `undefined`.
     * @return Children of `element` or root if no element is passed.
     */
    public getChildren(element?: TestWorkspaceFolder | TestDataItem): TestWorkspaceFolder[] | TestDataItem[] {
        if (!element && Array.isArray(this.workspace.workspaceFolders) && this.workspace.workspaceFolders.length > 0) {
            return this.workspace.workspaceFolders
                .filter(workspaceFolder => this.testStore.getTests(workspaceFolder.uri))
                .map(workspaceFolder => new TestWorkspaceFolder(workspaceFolder));
        }
        if (element instanceof TestWorkspaceFolder) {
            const tests = this.testStore.getTests(element.workspaceFolder.uri);
            return tests ? tests.rootTestFolders : [];
        } else {
            const tests = this.testStore.getTests(element.resource);
            if (element === undefined) {
                return tests && tests.testFolders ? tests.rootTestFolders : [];
            }

            return getChildren(element);
        }
    }

    /**
     * Optional method to return the parent of `element`.
     * Return `null` or `undefined` if `element` is a child of root.
     *
     * **NOTE:** This method should be implemented in order to access [reveal](#TreeView.reveal) API.
     *
     * @param element The element for which the parent has to be returned.
     * @return Parent of `element`.
     */
    public async getParent?(element: TestWorkspaceFolder | TestDataItem): Promise<TestWorkspaceFolder | TestDataItem> {
        if (element instanceof TestWorkspaceFolder) {
            return;
        }
        const tests = this.testStore.getTests(element.resource);
        return tests ? getParent(tests, element)! : undefined;
    }

    /**
     * Refresh the view by rebuilding the model and signaling the tree view to update itself.
     *
     * @param resource The resource 'root' for this refresh to occur under.
     */
    public refresh(resource: Uri): void {
        const workspaceFolder = this.workspace.getWorkspaceFolder(resource);
        if (!workspaceFolder) {
            return;
        }
        const tests = this.testStore.getTests(resource);
        if (tests && tests.testFolders) {
            this._onDidChangeTreeData.fire(new TestWorkspaceFolder(workspaceFolder));
        }
    }

    /**
     * Event handler for TestStatusChanged (coming from the IUnitTestManagementService).
     * ThisThe TreeView needs to know when we begin discovery and when discovery completes.
     *
     * @param e The event payload containing context for the status change
     */
    private onTestStatusChanged(e: WorkspaceTestStatus) {
        if (e.status === TestStatus.Discovering) {
            this.testsAreBeingDiscovered.set(e.workspace.fsPath, true);
            return;
        }
        if (!this.testsAreBeingDiscovered.get(e.workspace.fsPath)) {
            return;
        }
        this.testsAreBeingDiscovered.set(e.workspace.fsPath, false);
        this.refresh(e.workspace);
    }
}
