/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const path = require('path');

exports.connect = function(outPath, handle) {
	// const bootstrapPath = path.join(outPath, 'bootstrap-amd.js');
	// const { load } = require(bootstrapPath);
	// return new Promise((c, e) => load('vs/platform/driver/node/driver', ({ connect }) => connect(handle).then(c, e), e));

	const bootstrapPath = path.join(outPath, 'bootstrap-amd.js');
	const { load } = require(bootstrapPath);
	// console.log(`Here is bootstrapPath ${bootstrapPath}`);
	// console.log(`Here is outPath ${outPath}`);
	// console.log(`Here is handle ${handle}`);
	// console.log(`Here is load ${load}`);
	return new Promise((c, reject) => {
		return load(
			'vs/platform/driver/node/driver',
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
