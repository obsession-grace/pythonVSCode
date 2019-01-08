// tslint:disable:no-any

import { ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import '../../common/extensions';
import { isTestExecution } from '../constants';
import { traceError, traceVerbose } from '../logger';

// tslint:disable-next-line:no-require-imports no-var-requires
const _debounce = require('lodash/debounce') as typeof import('lodash/debounce');

/**
 * Debounces a function execution. Function must return either a void or a promise that resolves to a void.
 * @export
 * @param {number} [wait] Wait time.
 * @returns void
 */
export function debounce(wait?: number) {
    // tslint:disable-next-line:no-any no-function-expression
    return function (_target: any, _propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
        const originalMethod = descriptor.value!;
        // If running tests, lets not debounce (so tests run fast).
        wait = wait && isTestExecution() ? undefined : wait;
        // tslint:disable-next-line:no-invalid-this no-any
        (descriptor as any).value = _debounce(function () { return originalMethod.apply(this, arguments); }, wait);
    };
}

type vsCodeType = typeof import('vscode');
type cacheData = {
    value: any;
    expiry: number;
};
const simpleCache = new Map<string, cacheData>();

function getCachedData(key: string): undefined | cacheData {
    const data = simpleCache.get(key);
    if (!data) {
        return;
    }
    return data.expiry < Date.now() ? undefined : data;
}
function storeCachedData(key: string, data: any, expiryDurationMs: number): void {
    simpleCache.set(key, {
        value: data,
        expiry: Date.now() + expiryDurationMs
    });
}
// tslint:disable-next-line:no-any no-require-imports
export function getCacheKeyFromFunctionArgs(fnArgs: any[], vscode: vsCodeType = require('vscode')): string {
    const keys: string[] = [];
    fnArgs.forEach((arg, index) => {
        if (index > 0) {
            return keys.push(`${arg}`);
        }
        // get workspace related to this resource
        if (!Array.isArray(vscode.workspace.workspaceFolders) || vscode.workspace.workspaceFolders.length === 0) {
            return keys.push('undefined');
        }
        const folder = vscode.workspace.getWorkspaceFolder(arg as Uri);
        if (!folder) {
            return keys.push('undefined');
        }
        const pythonPath = vscode.workspace.getConfiguration('python', arg as Uri).get<string>('pythonPath');
        keys.push(`${folder.uri.fsPath}-${pythonPath}`);
    });

    return keys.join('-Arg-Separator-');
}

// tslint:disable-next-line:no-any
type PromiseFunctionWithFirstArgOfResource = (...any: [Uri | undefined, ...any[]]) => Promise<any>;

// tslint:disable-next-line:no-require-imports
export function cacheResourceSpecificIngterpreterData(expiryDurationMs: number, vscode: vsCodeType = require('vscode')) {
    return function (_target: Object, _propertyName: string, descriptor: TypedPropertyDescriptor<PromiseFunctionWithFirstArgOfResource>) {
        const originalMethod = descriptor.value!;
        // tslint:disable-next-line:no-any no-function-expression
        descriptor.value = async function (...args: [Uri | undefined, ...any[]]) {
            const cacheKey = getCacheKeyFromFunctionArgs(args, vscode);
            const data = getCachedData(cacheKey);
            if (data) {
                traceVerbose(`Cached data exists ${cacheKey}`);
                return Promise.resolve(data.value);
            }
            // tslint:disable-next-line:no-invalid-this
            const promise = originalMethod.apply(this, args) as Promise<any>;
            promise.then(result => storeCachedData(cacheKey, result, expiryDurationMs)).ignoreErrors();
            return promise;
        };
    };
}

/**
 * Swallows exceptions thrown by a function. Function must return either a void or a promise that resolves to a void.
 * When exceptions (including in promises) are caught, this will return `undefined` to calling code.
 * @export
 * @param {string} [scopeName] Scope for the error message to be logged along with the error.
 * @returns void
 */
export function swallowExceptions(scopeName: string) {
    // tslint:disable-next-line:no-any no-function-expression
    return function (_target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
        const originalMethod = descriptor.value!;
        const errorMessage = `Python Extension (Error in ${scopeName}, method:${propertyName}):`;
        // tslint:disable-next-line:no-any no-function-expression
        descriptor.value = function (...args: any[]) {
            try {
                // tslint:disable-next-line:no-invalid-this no-use-before-declare no-unsafe-any
                const result = originalMethod.apply(this, args);

                // If method being wrapped returns a promise then wait and swallow errors.
                if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                    return (result as Promise<void>).catch(error => {
                        if (isTestExecution()) {
                            return;
                        }
                        traceError(errorMessage, error);
                    });
                }
            } catch (error) {
                if (isTestExecution()) {
                    return;
                }
                traceError(errorMessage, error);
            }
        };
    };
}

// tslint:disable-next-line:no-any
type PromiseFunction = (...any: any[]) => Promise<any>;

export function displayProgress(title: string, location = ProgressLocation.Window) {
    return function (_target: Object, _propertyName: string, descriptor: TypedPropertyDescriptor<PromiseFunction>) {
        const originalMethod = descriptor.value!;
        // tslint:disable-next-line:no-any no-function-expression
        descriptor.value = async function (...args: any[]) {
            const progressOptions: ProgressOptions = { location, title };
            // tslint:disable-next-line:no-invalid-this
            const promise = originalMethod.apply(this, args);
            if (!isTestExecution()) {
                window.withProgress(progressOptions, () => promise);
            }
            return promise;
        };
    };
}
