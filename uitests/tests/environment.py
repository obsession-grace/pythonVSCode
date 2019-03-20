# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import tests


def before_all(context):
    options = tests.vscode.application.get_options(**context.config.userdata)
    app_context = tests.vscode.setup.start(options)
    context.driver = app_context.driver
    context.options = app_context.options
    context.workspace_repo = None


def after_all(context):
    tests.vscode.application.exit(context)


def before_feature(context, feature):
    repo = [tag for tag in feature.tags if tag.startswith("https://github.com/")]
    tests.tools.empty_directory(context.options.workspace_folder)
    if repo:
        context.workspace_repo = repo[0]
        tests.vscode.setup.setup_workspace(
            repo[0], context.options.workspace_folder, context.options.temp_folder
        )
    else:
        context.workspace_repo = None


def before_scenario(context, feature):
    context.options = tests.vscode.application.get_options(**context.config.userdata)


def after_scenario(context, feature):
    if feature.exception is not None:
        tests.vscode.application.capture_screen(context)
    tests.vscode.notifications.clear(context)
    tests.vscode.setup.reset_workspace(context)


def after_step(context, step):
    if step.exception is not None:
        tests.vscode.application.capture_screen(context)
