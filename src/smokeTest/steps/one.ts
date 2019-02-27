// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { expect } from 'chai';
import { Before, BeforeAll, Given, setWorldConstructor, Then, When } from 'cucumber';

// tslint:disable: no-function-expression no-invalid-this

// // Synchronous
// BeforeAll(function () {
//     console.log('before all');
// });
// // Synchronous
// Before(function () {
//     console.log('before');
// });

Given('a variable set to {int}', function (number) {
    this.setTo(number);
});

When('I increment the variable by {int}', async function (number) {
    // console.log('start');
    this.incrementBy(number);
    // await new Promise(resolve => setTimeout(resolve, 3000));
    // console.log('end');
    return Promise.resolve();
});

Then('the variable should contain {int}', function (number) {
    expect(this.variable).to.eql(number);
});

// class CustomWorld {
//     public variable: number;
//     constructor() {
//         this.variable = 0;
//     }

//     public setTo(number: number) {
//         this.variable = number;
//     }

//     public incrementBy(number: number) {
//         this.variable += number;
//     }
// }

// setWorldConstructor(CustomWorld);
