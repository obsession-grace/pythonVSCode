import { inject, injectable } from 'inversify';
import { Disposable, Event, EventEmitter, Uri } from 'vscode';
import { IWorkspaceService } from '../../../common/application/types';
import { IDisposableRegistry } from '../../../common/types';
import { TestDataItem } from '../../types';
import { FlattenedTestFunction, FlattenedTestSuite, ITestCollectionStorageService, ITestResultsService, TestFile, TestFolder, TestFunction, Tests, TestSuite } from './../types';

@injectable()
export class TestCollectionStorageService implements ITestCollectionStorageService {
    private _onDidChange = new EventEmitter<{ uri: Uri; data?: TestDataItem }>();
    private testsIndexedByWorkspaceUri = new Map<string, Tests | undefined>();

    constructor(@inject(IDisposableRegistry) disposables: Disposable[],
        @inject(ITestResultsService) private readonly resultsService: ITestResultsService,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService) {
        disposables.push(this);
    }
    public get onDidChange(): Event<{ uri: Uri; data?: TestDataItem }> {
        return this._onDidChange.event;
    }
    public getTests(resource: Uri): Tests | undefined {
        const workspaceFolder = this.workspaceService.getWorkspaceFolderIdentifier(resource);
        return this.testsIndexedByWorkspaceUri.has(workspaceFolder) ? this.testsIndexedByWorkspaceUri.get(workspaceFolder) : undefined;
    }
    public storeTests(resource: Uri, tests: Tests | undefined): void {
        const workspaceFolder = this.workspaceService.getWorkspaceFolderIdentifier(resource);
        const existingTests = this.getTests(resource);
        if (existingTests && tests && this.canMergeTestData(existingTests, tests)) {
            this.mergeTestData(existingTests, tests);
        }
        this.testsIndexedByWorkspaceUri.set(workspaceFolder, tests);
        this._onDidChange.fire({ uri: resource });
    }
    public findFlattendTestFunction(resource: Uri, func: TestFunction): FlattenedTestFunction | undefined {
        const tests = this.getTests(resource);
        if (!tests) {
            return;
        }
        return tests.testFunctions.find(f => f.testFunction === func);
    }
    public findFlattendTestSuite(resource: Uri, suite: TestSuite): FlattenedTestSuite | undefined {
        const tests = this.getTests(resource);
        if (!tests) {
            return;
        }
        return tests.testSuites.find(f => f.testSuite === suite);
    }
    public dispose() {
        this.testsIndexedByWorkspaceUri.clear();
    }
    public update(resource: Uri, item: TestDataItem): void {
        this._onDidChange.fire({ uri: resource, data: item });
    }
    protected canMergeTestData(existingTests: Tests, newTests: Tests): boolean {
        // Adding/remoging functions or suites are allowed.
        if (existingTests.testFiles.length !== newTests.testFiles.length ||
            existingTests.rootTestFolders.length !== newTests.rootTestFolders.length ||
            existingTests.testFolders.length !== newTests.testFolders.length) {
            return false;
        }
        return true;
    }
    protected mergeTestData(existingTests: Tests, newTests: Tests): void {
        mergeFolders(existingTests.testFolders, newTests.testFolders);
        this.resultsService.updateResults(existingTests);
    }
}

function mergeFolders(source: TestFolder[], target: TestFolder[]): void {
    source.forEach(sourceFolder => {
        const targetFolder = target.find(fn => fn.name === sourceFolder.name && fn.nameToRun === sourceFolder.nameToRun);
        if (!targetFolder) {
            return;
        }
        mergeValueTypes<TestFolder>(sourceFolder, targetFolder);
        mergeFiles(sourceFolder.testFiles, targetFolder.testFiles);
    });
}
function mergeFiles(source: TestFile[], target: TestFile[]): void {
    source.forEach(sourceFile => {
        const targetFile = target.find(fn => fn.name === sourceFile.name && fn.nameToRun === sourceFile.nameToRun);
        if (!targetFile) {
            return;
        }
        mergeValueTypes<TestFile>(sourceFile, targetFile);
        mergeFunctions(sourceFile.functions, targetFile.functions);
        mergeSuites(sourceFile.suites, targetFile.suites);
    });
}

function mergeFunctions(source: TestFunction[], target: TestFunction[]): void {
    source.forEach(sourceFn => {
        const targetFn = target.find(fn => fn.name === sourceFn.name && fn.nameToRun === sourceFn.nameToRun);
        if (!targetFn) {
            return;
        }
        mergeValueTypes<TestFunction>(sourceFn, targetFn);
    });
}

function mergeSuites(source: TestSuite[], target: TestSuite[]): void {
    source.forEach(sourceSuite => {
        const targetSuite = target.find(suite => suite.name === sourceSuite.name &&
            suite.nameToRun === sourceSuite.nameToRun &&
            suite.xmlName === sourceSuite.xmlName);
        if (!targetSuite) {
            return;
        }
        mergeValueTypes<TestSuite>(sourceSuite, targetSuite);
        mergeFunctions(sourceSuite.functions, targetSuite.functions);
        mergeSuites(sourceSuite.suites, targetSuite.suites);
    });
}

function mergeValueTypes<T>(source: T, target: T): void {
    Object.keys(source).forEach(key => {
        const value = source[key];
        if (['boolean', 'number', 'string', 'undefined'].indexOf(typeof value) >= 0) {
            target[key] = value;
        }
    });
}
