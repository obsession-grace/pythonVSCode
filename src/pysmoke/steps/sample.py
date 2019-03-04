# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from behave import given, when, then

@given('we have behave installed')
def step_impl(context):
    pass

@when('we implement a test')
def step_impl(context):
    assert True is not False

@then('behave will test it for us!')
def step_impl(context):
    assert context.failed is False

@then('Another one!')
def step_impl(context):
    assert context.failed is False
