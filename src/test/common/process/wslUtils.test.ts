// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// import { expect, use } from 'chai';
// import * as chaiAsPromised from 'chai-as-promised';
// import { ChildProcess } from '../../../client/common/process/childProcess';
// import { initialize } from './../../initialize';

// use(chaiAsPromised);

// suite('ChildProcess', () => {
//     suiteSetup(initialize);

//     test('Spawn should start a process and end', async () => {
//         const childProcess = new ChildProcess();
//         const proc = childProcess.spawn('node', ['--version'], {});
//         proc.stdout.setEncoding('utf8');
//         const dataPromise = new Promise<string>((resolve, reject) => {
//             let data = '';
//             proc.stdout.on('data', output => data += output);
//             proc.on('close', () => resolve(data.trim()));
//             proc.on('error', reject);
//         });

//         expect(proc).not.to.be.an('undefined', 'Process is undefined');
//         await expect(dataPromise).to.eventually.be.length.greaterThan(0, 'Invalid output');
//     });

//     test('Spawn should fail with an error', async () => {
//         const childProcess = new ChildProcess();
//         const proc = childProcess.spawn('!@#$', ['--version'], {});
//         const dataPromise = new Promise<void>((resolve, reject) => {
//             proc.on('close', resolve);
//             proc.on('error', reject);
//         });

//         expect(proc).not.to.be.an('undefined', 'Process is undefined');
//         await expect(dataPromise).to.eventually.be.rejected.and.to.have.property('code', 'ENOENT', 'Invalid error code');
//     });
// });
