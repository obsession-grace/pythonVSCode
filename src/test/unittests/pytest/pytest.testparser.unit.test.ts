// <<<<<<< HEAD
// // <<<<<<< HEAD
// // // <<<<<<< HEAD
// // // // <<<<<<< HEAD
// // // // // // Copyright (c) Microsoft Corporation. All rights reserved.
// // // // // // Licensed under the MIT License.

// // // // // 'use strict';

// // // // // import { expect, use } from 'chai';
// // // // // import * as chaipromise from 'chai-as-promised';
// // // // // import * as typeMoq from 'typemoq';
// // // // // import { CancellationToken, OutputChannel, Uri } from 'vscode';
// // // // // import { IApplicationShell, ICommandManager } from '../../../client/common/application/types';
// // // // // import { OSType } from '../../../client/common/utils/platform';
// // // // // import { IServiceContainer } from '../../../client/ioc/types';
// // // // // import { DiscoveredTestData } from '../../../client/unittests/common/discoveredTests';
// // // // // import { TestsHelper } from '../../../client/unittests/common/testUtils';
// // // // // import { TestFlatteningVisitor } from '../../../client/unittests/common/testVisitors/flatteningVisitor';
// // // // // import {
// // // // //     FlattenedTestFunction, SubtestParent, TestDiscoveryOptions, Tests
// // // // // } from '../../../client/unittests/common/types';
// // // // // import { TestsParser as PyTestsParser } from '../../../client/unittests/pytest/services/parserService';
// // // // // import { pytestScenario } from './pytest.testparser.testdata';

// // // // // use(chaipromise);

// // // // // <<<<<<< HEAD
// // // // // // tslint:disable:max-func-body-length

// // // // // // The PyTest test parsing is done via the stdout result of the
// // // // // // `pytest --collect-only` command.
// // // // // //
// // // // // // There are a few limitations with this approach, the largest issue is mixing
// // // // // // package and non-package style codebases (stdout does not give subdir
// // // // // // information of tests in a package when __init__.py is not present).
// // // // // //
// // // // // // However, to test all of the various layouts that are available, we have
// // // // // // created a JSON structure that defines all the tests - see file
// // // // // // `pytest_unittest_parser_data.ts` in this folder.
// // // // // suite('Unit Tests - PyTest - Test Parser used in discovery', () => {
// // // // //     let serviceContainer: typeMoq.IMock<IServiceContainer>;
// // // // //     let appShell: typeMoq.IMock<IApplicationShell>;
// // // // //     let cmdMgr: typeMoq.IMock<ICommandManager>;

// // // // //     setup(() => {
// // // // //         serviceContainer = typeMoq.Mock.ofType<IServiceContainer>(undefined, typeMoq.MockBehavior.Strict);

// // // // //         appShell = typeMoq.Mock.ofType<IApplicationShell>(undefined, typeMoq.MockBehavior.Strict);
// // // // //         serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // // // //             .returns(() => appShell.object);

// // // // //        cmdMgr = typeMoq.Mock.ofType<ICommandManager>(undefined, typeMoq.MockBehavior.Strict);
// // // // //         serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // // // //             .returns(() => cmdMgr.object);
// // // // //     });

// // // // //     function makeOptions(rootdir: string): TestDiscoveryOptions {
// // // // //         const outChannel = typeMoq.Mock.ofType<OutputChannel>(undefined, typeMoq.MockBehavior.Strict);
// // // // //         const cancelToken = typeMoq.Mock.ofType<CancellationToken>(undefined, typeMoq.MockBehavior.Strict);
// // // // //         cancelToken.setup(c => c.isCancellationRequested)
// // // // //             .returns(() => false);
// // // // //         const wsFolder = typeMoq.Mock.ofType<Uri>(undefined, typeMoq.MockBehavior.Strict);

// // // // //         return {
// // // // //             args: [],
// // // // //             cwd: rootdir,
// // // // //             ignoreCache: true,
// // // // //             outChannel: outChannel.object,
// // // // //             token: cancelToken.object,
// // // // //             workspaceFolder: wsFolder.object
// // // // //         };
// // // // //     }

// // // // //     function makeParser(): PyTestsParser {
// // // // //         const testFlattener: TestFlatteningVisitor = new TestFlatteningVisitor();
// // // // //         const testHlp: TestsHelper = new TestsHelper(testFlattener, serviceContainer.object);
// // // // //         return new PyTestsParser(testHlp);
// // // // //     }

// // // // //     // Build tests for the test data that is relevant for this platform.
// // // // //     const testPlatformType: PytestDataPlatformType =
// // // // //         getOSType() === OSType.Windows ?
// // // // //             PytestDataPlatformType.Windows : PytestDataPlatformType.NonWindows;

// // // // //     pytestScenarioData.forEach((testScenario) => {
// // // // //         if (testPlatformType === testScenario.platform) {

// // // // //             const testDescription: string =
// // // // //                 `PyTest${testScenario.pytest_version_spec}: ${testScenario.description}`;

// // // // //             test(testDescription, async () => {
// // // // //                 // Each test scenario has a 'stdout' member that is an array of
// // // // //                 // stdout lines. Join them here such that the parser can operate
// // // // //                 // on stdout-like data.
// // // // //                 const stdout: string = testScenario.stdout.join('\n');
// // // // //                 const options = makeOptions(testScenario.rootdir);
// // // // //                 const parser = makeParser();

// // // // //                 const parsedTests: Tests = parser.parse(stdout, options);

// // // // //                 // Now we can actually perform tests.
// // // // //                 expect(parsedTests).is.not.equal(
// // // // //                     undefined,
// // // // //                     'Should have gotten tests extracted from the parsed pytest result content.');

// // // // //                 expect(parsedTests.testFunctions.length).equals(
// // // // //                     testScenario.functionCount,
// // // // //                     `Parsed pytest summary contained ${testScenario.functionCount} test functions.`);

// // // // //                 testScenario.test_functions.forEach((funcName: string) => {
// // // // //                     const findAllTests: FlattenedTestFunction[] | undefined = parsedTests.testFunctions.filter(
// // // // //                         (tstFunc: FlattenedTestFunction) => {
// // // // //                             return tstFunc.testFunction.nameToRun === funcName;
// // // // //                         });
// // // // //                     // Each test identified in the testScenario should exist once and only once.
// // // // //                     expect(findAllTests).is.not.equal(undefined, `Could not find "${funcName}" in tests.`);
// // // // //                     expect(findAllTests.length).is.equal(1, 'There should be exactly one instance of each test.');
// // // // // =======
// // // // // // This suite of tests is to ensure that our Python test adapter JSON is being transformed to the
// // // // // // `Tests` data structure as required by the various testing functions supported by this extension.
// // // // // // The input data (stringified JSON) and the expected results (Tests described in JSON) are found
// // // // // // in the `pytest.testparser.testdata.ts` file adjacent to this one.

// // // // // // tslint:disable-next-line:max-func-body-length
// // // // // suite('PyTest parser used in discovery', () => {

// // // // //     pytestScenario.forEach((testScenario) => {
// // // // //         test('Ensure JSON test data is correct', () => {
// // // // //             const t: DiscoveredTestData[] = JSON.parse(testScenario.json);
// // // // //             expect(t).to.not.equal(undefined, 'Bad dates');
// // // // //         });

// // // // //         test(testScenario.scenarioDescription, async () => {
// // // // //             // Setup the service container for use by the parser.
// // // // //             const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// // // // //             const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// // // // //             const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// // // // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // // // //                 .returns(() => {
// // // // //                     return appShell.object;
// // // // //                 });
// // // // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // // // //                 .returns(() => {
// // // // //                     return cmdMgr.object;
// // // // // >>>>>>> Update pytest parser test data
// // // // //                 });

// // // // //             // Create mocks used in the test discovery setup.
// // // // //             const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// // // // //             const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// // // // //             cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// // // // //             const wsFolder = typeMoq.Mock.ofType<Uri>();

// // // // //             // Create the test options for the mocked-up test. All data is either
// // // // //             // mocked or is taken from the JSON test data itself.
// // // // //             const options: TestDiscoveryOptions = {
// // // // //                 args: [],
// // // // //                 cwd: '.',
// // // // //                 ignoreCache: true,
// // // // //                 outChannel: outChannel.object,
// // // // //                 token: cancelToken.object,
// // // // //                 workspaceFolder: wsFolder.object
// // // // //             };

// // // // //             // Setup the parser.
// // // // //             const testFlattener: TestFlatteningVisitor = new TestFlatteningVisitor();
// // // // //             const testHlp: TestsHelper = new TestsHelper(testFlattener, serviceContainer.object);
// // // // //             const parser = new PyTestsParser(testHlp);

// // // // //             const tests: Tests = parser.parse(testScenario.json, options);
// // // // //             expect(testScenario.expectedResult).to.deep.equal(tests);
// // // // //         });
// // // // //     });

// // // // // <<<<<<< HEAD
// // // // //     test('Handle parameterized tests', () => {
// // // // //         // tslint:disable-next-line:no-multiline-string
// // // // //         const stdout = `
// // // // // ============================= test session starts =============================
// // // // // platform linux -- Python 3.7.1, pytest-4.2.1, py-1.7.0, pluggy-0.8.1
// // // // // rootdir: /home/user/test/pytest_scenario, inifile:
// // // // // collected 2 items
// // // // // <Package /home/user/test/pytest_scenario/tests>
// // // // //   <Module test_spam.py>
// // // // //     <Function test_with_subtests[1-2]>
// // // // //     <Function test_with_subtests[3-4]>

// // // // // ======================== no tests ran in 0.36 seconds =========================`;
// // // // //         const options = makeOptions('/home/user/test/pytest_scenario');
// // // // //         const parser = makeParser();

// // // // //         const tests: Tests = parser.parse(stdout, options);

// // // // //         expect(tests.testFunctions.length).is.equal(2);
// // // // //         expect(tests.testFunctions[0].testFunction.name)
// // // // //             .is.equal('test_with_subtests[1-2]');
// // // // //         expect(tests.testFunctions[0].testFunction.nameToRun)
// // // // //             .is.equal('tests/test_spam.py::test_with_subtests[1-2]');
// // // // //         expect(tests.testFunctions[1].testFunction.name)
// // // // //             .is.equal('test_with_subtests[3-4]');
// // // // //         expect(tests.testFunctions[1].testFunction.nameToRun)
// // // // //             .is.equal('tests/test_spam.py::test_with_subtests[3-4]');
// // // // //         const parent: SubtestParent = {
// // // // //             name: 'test_with_subtests',
// // // // //             nameToRun: 'tests/test_spam.py::test_with_subtests',
// // // // //             asSuite: {
// // // // //                 resource: Uri.file('/home/user/test/pytest_scenario'),
// // // // //                 name: 'test_with_subtests',
// // // // //                 nameToRun: 'tests/test_spam.py::test_with_subtests',
// // // // //                 functions: [
// // // // //                     tests.testFunctions[0].testFunction,
// // // // //                     tests.testFunctions[1].testFunction
// // // // //                 ],
// // // // //                 suites: [],
// // // // //                 isUnitTest: false,
// // // // //                 isInstance: false,
// // // // //                 xmlName: '',
// // // // //                 time: 0
// // // // //             },
// // // // //             time: 0
// // // // //         };
// // // // //         expect(tests.testFunctions[0].testFunction.subtestParent).is.deep.equal(parent);
// // // // //         expect(tests.testFunctions[1].testFunction.subtestParent).is.deep.equal(parent);
// // // // //     });
// // // // // =======
// // // // //     // pytestScenarioData.forEach((testScenario) => {
// // // // //     //     if (testPlatformType === testScenario.platform) {

// // // // //     //         const testDescription: string =
// // // // //     //             `PyTest${testScenario.pytest_version_spec}: ${testScenario.description}`;

// // // // //     // test(testDescription, async () => {
// // // // //     //     // Setup the service container for use by the parser.
// // // // //     //     const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// // // // //     //     const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// // // // //     //     const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// // // // //     //     serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // // // //     //         .returns(() => {
// // // // //     //             return appShell.object;
// // // // //     //         });
// // // // //     //     serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // // // //     //         .returns(() => {
// // // // //     //             return cmdMgr.object;
// // // // //     //         });

// // // // //     //     // Create mocks used in the test discovery setup.
// // // // //     //     const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// // // // //     //     const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// // // // //     //     cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// // // // //     //     const wsFolder = typeMoq.Mock.ofType<Uri>();

// // // // //     //     // Create the test options for the mocked-up test. All data is either
// // // // //     //     // mocked or is taken from the JSON test data itself.
// // // // //     //     const options: TestDiscoveryOptions = {
// // // // //     //         args: [],
// // // // //     //         cwd: testScenario.rootdir,
// // // // //     //         ignoreCache: true,
// // // // //     //         outChannel: outChannel.object,
// // // // //     //         token: cancelToken.object,
// // // // //     //         workspaceFolder: wsFolder.object
// // // // //     //     };

// // // // //     //     // Setup the parser.
// // // // //     //     const testFlattener: TestFlatteningVisitor = new TestFlatteningVisitor();
// // // // //     //     const testHlp: TestsHelper = new TestsHelper(testFlattener, serviceContainer.object);
// // // // //     //     const parser = new PyTestsParser(testHlp);

// // // // //     //     // Each test scenario has a 'stdout' member that is an array of
// // // // //     //     // stdout lines. Join them here such that the parser can operate
// // // // //     //     // on stdout-like data.
// // // // //     //     const stdout: string = testScenario.stdout.join('\n');

// // // // //     //     const parsedTests: Tests = parser.parse(stdout, options);

// // // // //     //     // Now we can actually perform tests.
// // // // //     //     expect(parsedTests).is.not.equal(
// // // // //     //         undefined,
// // // // //     //         'Should have gotten tests extracted from the parsed pytest result content.');

// // // // //     //     expect(parsedTests.testFunctions.length).equals(
// // // // //     //         testScenario.functionCount,
// // // // //     //         `Parsed pytest summary contained ${testScenario.functionCount} test functions.`);

// // // // //     //     testScenario.test_functions.forEach((funcName: string) => {
// // // // //     //         const findAllTests: FlattenedTestFunction[] | undefined = parsedTests.testFunctions.filter(
// // // // //     //             (tstFunc: FlattenedTestFunction) => {
// // // // //     //                 return tstFunc.testFunction.nameToRun === funcName;
// // // // //     //             });
// // // // //     //         // Each test identified in the testScenario should exist once and only once.
// // // // //     //         expect(findAllTests).is.not.equal(undefined, `Could not find "${funcName}" in tests.`);
// // // // //     //         expect(findAllTests.length).is.equal(1, 'There should be exactly one instance of each test.');
// // // // //     //     });

// // // // //     // });
// // // // //     //     }
// // // // //     // });
// // // // // >>>>>>> Update pytest parser test data
// // // // // });
// // // // =======
// // // // // Copyright (c) Microsoft Corporation. All rights reserved.
// // // // // Licensed under the MIT License.

// // // // 'use strict';

// // // // import { expect, use } from 'chai';
// // // // import * as chaipromise from 'chai-as-promised';
// // // // import * as typeMoq from 'typemoq';
// // // // import { CancellationToken, OutputChannel, Uri } from 'vscode';
// // // // import { IApplicationShell, ICommandManager } from '../../../client/common/application/types';
// // // // import { IServiceContainer } from '../../../client/ioc/types';
// // // // import { DiscoveredTestData } from '../../../client/unittests/common/discoveredTests';
// // // // import { TestsHelper } from '../../../client/unittests/common/testUtils';
// // // // import { TestFlatteningVisitor } from '../../../client/unittests/common/testVisitors/flatteningVisitor';
// // // // import { TestDiscoveryOptions, Tests } from '../../../client/unittests/common/types';
// // // // import { TestsParser as PyTestsParser } from '../../../client/unittests/pytest/services/parserService';
// // // // import { pytestScenario } from './pytest.testparser.testdata';

// // // // use(chaipromise);

// // // // // This suite of tests is to ensure that our Python test adapter JSON is being transformed to the
// // // // // `Tests` data structure as required by the various testing functions supported by this extension.
// // // // // The input data (stringified JSON) and the expected results (Tests described in JSON) are found
// // // // // in the `pytest.testparser.testdata.ts` file adjacent to this one.

// // // // // tslint:disable-next-line:max-func-body-length
// // // // suite('PyTest parser used in discovery', () => {

// // // //     pytestScenario.forEach((testScenario) => {
// // // //         test('Ensure JSON test data is correct', () => {
// // // //             const t: DiscoveredTestData[] = JSON.parse(testScenario.json);
// // // //             expect(t).to.not.equal(undefined, 'Bad dates');
// // // //         });

// // // //         test(testScenario.scenarioDescription, async () => {
// // // //             // Setup the service container for use by the parser.
// // // //             const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// // // //             const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// // // //             const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// // // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // // //                 .returns(() => {
// // // //                     return appShell.object;
// // // //                 });
// // // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // // //                 .returns(() => {
// // // //                     return cmdMgr.object;
// // // //                 });

// // // //             // Create mocks used in the test discovery setup.
// // // //             const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// // // //             const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// // // //             cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// // // //             const wsFolder = typeMoq.Mock.ofType<Uri>();

// // // //             // Create the test options for the mocked-up test. All data is either
// // // //             // mocked or is taken from the JSON test data itself.
// // // //             const options: TestDiscoveryOptions = {
// // // //                 args: [],
// // // //                 cwd: '.',
// // // //                 ignoreCache: true,
// // // //                 outChannel: outChannel.object,
// // // //                 token: cancelToken.object,
// // // //                 workspaceFolder: wsFolder.object
// // // //             };

// // // //             // Setup the parser.
// // // //             const testFlattener: TestFlatteningVisitor = new TestFlatteningVisitor();
// // // //             const testHlp: TestsHelper = new TestsHelper(testFlattener, serviceContainer.object);
// // // //             const parser = new PyTestsParser(testHlp);

// // // //             const tests: Tests = parser.parse(testScenario.json, options);
// // // //             expect(testScenario.expectedResult).to.deep.equal(tests);
// // // //         });
// // // //     });
// // // // });
// // // // >>>>>>> Fixups
// // // =======
// // // // Copyright (c) Microsoft Corporation. All rights reserved.
// // // // Licensed under the MIT License.

// // // 'use strict';

// // // import { expect, use } from 'chai';
// // // import * as chaipromise from 'chai-as-promised';
// // // import * as typeMoq from 'typemoq';
// // // import { CancellationToken, OutputChannel, Uri } from 'vscode';
// // // import { IApplicationShell, ICommandManager } from '../../../client/common/application/types';
// // // import { IServiceContainer } from '../../../client/ioc/types';
// // // import { TestsHelper } from '../../../client/unittests/common/testUtils';
// // // import { TestFlatteningVisitor } from '../../../client/unittests/common/testVisitors/flatteningVisitor';
// // // import { ITestsHelper, TestDiscoveryOptions, TestFile, Tests } from '../../../client/unittests/common/types';
// // // import { TestsParser as PyTestsParser } from '../../../client/unittests/pytest/services/parserService';
// // // import { pytestScenario } from './pytest.testparser.testdata';

// // // use(chaipromise);

// // // // This suite of tests is to ensure that our Python test adapter JSON is being transformed to the
// // // // `Tests` data structure as required by the various testing functions supported by this extension.
// // // // The input data (stringified JSON) and the expected results (Tests described in JSON) are found
// // // // in the `pytest.testparser.testdata.ts` file adjacent to this one.

// // // // tslint:disable-next-line:max-func-body-length
// // // suite('PyTest parser used in discovery', () => {

// // //     pytestScenario.forEach((testScenario) => {
// // //         test(`${testScenario.scenarioDescription} (convert to TestFiles)`, () => {
// // //             // Setup the service container for use by the parser.
// // //             const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// // //             const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// // //             const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // //                 .returns(() => {
// // //                     return appShell.object;
// // //                 });
// // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // //                 .returns(() => {
// // //                     return cmdMgr.object;
// // //                 });

// // //             // Create mocks used in the test discovery setup.
// // //             const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// // //             const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// // //             cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// // //             const wsFolder = typeMoq.Mock.ofType<Uri>();

// // //             // Create the test options for the mocked-up test. All data is either
// // //             // mocked or is taken from the JSON test data itself.
// // //             const options: TestDiscoveryOptions = {
// // //                 args: [],
// // //                 cwd: '.',
// // //                 ignoreCache: true,
// // //                 outChannel: outChannel.object,
// // //                 token: cancelToken.object,
// // //                 workspaceFolder: wsFolder.object
// // //             };

// // //             let testFilesParsed: TestFile[];
// // //             // set up the test flattener, but extact the TestFiles for inspection here instead of actually flattening them.
// // //             const testHelper = typeMoq.Mock.ofType<ITestsHelper>();
// // //             testHelper.setup(t => t.flattenTestFiles(typeMoq.It.is<TestFile[]>(v => true), typeMoq.It.isAny()))
// // //                 .returns((v: TestFile[]) => {
// // //                     testFilesParsed = v;
// // //                     return undefined;
// // //                 });

// // //             const parser = new PyTestsParser(testHelper.object);
// // //             parser.parse(testScenario.json, options);

// // //             expect(testFilesParsed).to.deep.equal(testScenario.expectedTestFiles);
// // //         });

// // //         test(testScenario.scenarioDescription, async () => {
// // //             // Setup the service container for use by the parser.
// // //             const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// // //             const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// // //             const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// // //                 .returns(() => {
// // //                     return appShell.object;
// // //                 });
// // //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// // //                 .returns(() => {
// // //                     return cmdMgr.object;
// // //                 });

// // //             // Create mocks used in the test discovery setup.
// // //             const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// // //             const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// // //             cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// // //             const wsFolder = typeMoq.Mock.ofType<Uri>();

// // //             // Create the test options for the mocked-up test. All data is either
// // //             // mocked or is taken from the JSON test data itself.
// // //             const options: TestDiscoveryOptions = {
// // //                 args: [],
// // //                 cwd: '.',
// // //                 ignoreCache: true,
// // //                 outChannel: outChannel.object,
// // //                 token: cancelToken.object,
// // //                 workspaceFolder: wsFolder.object
// // //             };

// // //             // Setup the parser.
// // //             const testFlattener: TestFlatteningVisitor = new TestFlatteningVisitor();
// // //             const testHlp: TestsHelper = new TestsHelper(testFlattener, serviceContainer.object);
// // //             const parser = new PyTestsParser(testHlp);

// // //             const tests: Tests = parser.parse(testScenario.json, options);
// // //             expect(tests).to.deep.equal(testScenario.expectedResult);
// // //         });
// // //     });
// // // });
// // // >>>>>>> Update test data/add test functions for the Tests results
// // =======
// // // Copyright (c) Microsoft Corporation. All rights reserved.
// // // Licensed under the MIT License.

// // 'use strict';

// // import { expect, use } from 'chai';
// // import * as chaipromise from 'chai-as-promised';
// // import * as typeMoq from 'typemoq';
// // import { CancellationToken, OutputChannel, Uri } from 'vscode';
// // import { IApplicationShell, ICommandManager } from '../../../client/common/application/types';
// // import { IServiceContainer } from '../../../client/ioc/types';
// // import { TestsHelper } from '../../../client/unittests/common/testUtils';
// // import { TestFlatteningVisitor } from '../../../client/unittests/common/testVisitors/flatteningVisitor';
// // import { ITestsHelper, TestDiscoveryOptions, TestFile, Tests } from '../../../client/unittests/common/types';
// // import { TestsParser as PyTestsParser } from '../../../client/unittests/pytest/services/parserService';
// // import { pytestScenario } from './pytest.testparser.testdata';

// // use(chaipromise);

// // // This suite of tests is to ensure that our Python test adapter JSON is being transformed to the
// // // `Tests` data structure as required by the various testing functions supported by this extension.
// // // The input data (stringified JSON) and the expected results (Tests described in JSON) are found
// // // in the `pytest.testparser.testdata.ts` file adjacent to this one.

// // // tslint:disable-next-line:max-func-body-length
// // suite('PyTest parser used in discovery', () => {

// //     pytestScenario.forEach((testScenario) => {
// //         test(`${testScenario.scenarioDescription} (convert to TestFiles)`, () => {
// //             // Setup the service container for use by the parser.
// //             const serviceContainer = typeMoq.Mock.ofType<IServiceContainer>();
// //             const appShell = typeMoq.Mock.ofType<IApplicationShell>();
// //             const cmdMgr = typeMoq.Mock.ofType<ICommandManager>();
// //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
// //                 .returns(() => {
// //                     return appShell.object;
// //                 });
// //             serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
// //                 .returns(() => {
// //                     return cmdMgr.object;
// //                 });

// //             // Create mocks used in the test discovery setup.
// //             const outChannel = typeMoq.Mock.ofType<OutputChannel>();
// //             const cancelToken = typeMoq.Mock.ofType<CancellationToken>();
// //             cancelToken.setup(c => c.isCancellationRequested).returns(() => false);
// //             const wsFolder = typeMoq.Mock.ofType<Uri>();

// //             // Create the test options for the mocked-up test. All data is either
// //             // mocked or is taken from the JSON test data itself.
// //             const options: TestDiscoveryOptions = {
// //                 args: [],
// //                 cwd: '.',
// //                 ignoreCache: true,
// //                 outChannel: outChannel.object,
// //                 token: cancelToken.object,
// //                 workspaceFolder: wsFolder.object
// //             };

// //             let testFilesParsed: TestFile[];
// //             // set up the test flattener, but extact the TestFiles for inspection here instead of actually flattening them.
// //             const testHelper = typeMoq.Mock.ofType<ITestsHelper>();
// //             testHelper.setup(t => t.flattenTestFiles(typeMoq.It.is<TestFile[]>(v => true), typeMoq.It.isAny()))
// //                 .returns((v: TestFile[]) => {
// //                     testFilesParsed = v;
// //                     return undefined;
// //                 });

// //             const parser = new PyTestsParser(testHelper.object);
// //             parser.parse(testScenario.json, options);

// //             expect(testFilesParsed).to.deep.equal(testScenario.expectedTestFiles);
// //         });

// //     });
// // });
// // >>>>>>> Remove unnecessary tests
// =======
// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// 'use strict';

// import { expect, use } from 'chai';
// import * as chaipromise from 'chai-as-promised';
// import * as typeMoq from 'typemoq';
// import { CancellationToken, OutputChannel, Uri } from 'vscode';
// import { IApplicationShell, ICommandManager } from '../../../client/common/application/types';
// import { IServiceContainer } from '../../../client/ioc/types';
// import { TestsHelper } from '../../../client/unittests/common/testUtils';
// import { TestFlatteningVisitor } from '../../../client/unittests/common/testVisitors/flatteningVisitor';
// import { ITestsHelper, TestDiscoveryOptions, TestFile, Tests } from '../../../client/unittests/common/types';
// import { TestsParser as PyTestsParser } from '../../../client/unittests/pytest/services/parserService';
// import { pytestScenario } from './pytest.testparser.testdata';

// use(chaipromise);

// // This suite of tests is to ensure that our Python test adapter JSON is being transformed to the
// // `Tests` data structure as required by the various testing functions supported by this extension.
// // The input data (stringified JSON) and the expected results (Tests described in JSON) are found
// // in the `pytest.testparser.testdata.ts` file adjacent to this one.

// // tslint:disable-next-line:max-func-body-length
// suite('PyTest parser used in discovery', () => {

//     // Type for keeping a test function's TestsHelper dependencies intact.
//     type TestHelperDependents = {
//         serviceContainer: typeMoq.IMock<IServiceContainer>;
//         appShell: typeMoq.IMock<IApplicationShell>;
//         cmdMgr: typeMoq.IMock<ICommandManager>;
//         flattener: TestFlatteningVisitor;
//     };

//     // Type for keeping test discovery options & dependencies intact.
//     type TestParserDiscoveryOptions = {
//         outChannel: typeMoq.IMock<OutputChannel>;
//         cancelToken: typeMoq.IMock<CancellationToken>;
//         wsFolder: typeMoq.IMock<Uri>;
//     };

//     // Create a TestsHelper and return it (and its dependancies)
//     function createTestsHelper(): [TestHelperDependents, TestsHelper] {
//         // Setup the service container for use by the parser.
//         const tDeps: TestHelperDependents = {
//             serviceContainer: typeMoq.Mock.ofType<IServiceContainer>(),
//             appShell: typeMoq.Mock.ofType<IApplicationShell>(),
//             cmdMgr: typeMoq.Mock.ofType<ICommandManager>(),
//             flattener: new TestFlatteningVisitor()
//         };

//         tDeps.serviceContainer.setup(s => s.get(typeMoq.It.isValue(IApplicationShell), typeMoq.It.isAny()))
//             .returns(() => {
//                 return tDeps.appShell.object;
//             });
//         tDeps.serviceContainer.setup(s => s.get(typeMoq.It.isValue(ICommandManager), typeMoq.It.isAny()))
//             .returns(() => {
//                 return tDeps.cmdMgr.object;
//             });

//         const testHelper: TestsHelper = new TestsHelper(tDeps.flattener, tDeps.serviceContainer.object);
//         return [tDeps, testHelper];
//     }

//     function createParserOptions(): [TestParserDiscoveryOptions, TestDiscoveryOptions] {
//         // Create mocks used in the test discovery setup.
//         const oDeps: TestParserDiscoveryOptions = {
//             outChannel: typeMoq.Mock.ofType<OutputChannel>(),
//             cancelToken: typeMoq.Mock.ofType<CancellationToken>(),
//             wsFolder: typeMoq.Mock.ofType<Uri>()
//         };
//         oDeps.cancelToken.setup(c => c.isCancellationRequested).returns(() => false);

//         // Create the test options for the mocked-up test. All data is either
//         // mocked or is taken from the JSON test data itself.
//         // tslint:disable-next-line:no-unnecessary-local-variable
//         const options: TestDiscoveryOptions = {
//             args: [],
//             cwd: '.',
//             ignoreCache: true,
//             outChannel: oDeps.outChannel.object,
//             token: oDeps.cancelToken.object,
//             workspaceFolder: oDeps.wsFolder.object
//         };

//         return [oDeps, options];
//     }

//     pytestScenario.forEach((testScenario) => {
//         test(`${testScenario.scenarioDescription} (convert to TestFiles)`, () => {

//             let testFilesParsed: TestFile[];
//             // set up the test flattener, but extact the TestFiles for inspection here instead of actually flattening them.
//             const testHelper = typeMoq.Mock.ofType<ITestsHelper>();
//             testHelper.setup(t => t.flattenTestFiles(typeMoq.It.is<TestFile[]>(v => true), typeMoq.It.isAny()))
//                 .returns((v: TestFile[]) => {
//                     testFilesParsed = v;
//                     return undefined;
//                 });

//             const parser = new PyTestsParser(testHelper.object);
//             const [_, options] = createParserOptions();
//             parser.parse(testScenario.json, options);

//             expect(testFilesParsed).to.deep.equal(testScenario.expectedTestFiles);
//         });
//     });

//     test('Parser handles the case when there is no test information given', () => {
//         const [_, testHelper] = createTestsHelper();
//         const [__, options] = createParserOptions();
//         const parser = new PyTestsParser(testHelper);

//         let result: Tests = parser.parse('', options);
//         expect(result).to.be.equal(undefined, 'Received tests structure when input was an empty string?');
//         result = parser.parse('      ', options);
//         expect(result).to.be.equal(undefined, 'Received tests structure when input was a blank string?');
//         result = parser.parse(undefined, options);
//         expect(result).to.be.equal(undefined, 'Received tests structure when input was undefined?');
//     });

//     test('Parser throws error when given invalid JSON string', () => {
//         const [_, testHelper] = createTestsHelper();
//         const [__, options] = createParserOptions();
//         const parser = new PyTestsParser(testHelper);
//         try {
//             parser.parse('This is not JSON, it is just a string.', options);
//             expect('Should_not_get_here').to.be.equal('here', 'Parser did not throw an exception for invalid JSON input.');
//         } catch (ex) {
//             expect(ex.message).to.contain('Could not discover tests');
//         }
//     });
// });
// >>>>>>> Adding/fixing further tests
