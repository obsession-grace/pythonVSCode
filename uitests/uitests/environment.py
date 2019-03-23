# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import uitests.tools
import uitests.vscode
import uitests.vscode.startup
import behave
import parse


@parse.with_pattern(r"\d+")
def parse_number(text):
    return int(text)


behave.register_type(Number=parse_number)


def before_all(context):
    options = uitests.vscode.application.get_options(**context.config.userdata)
    app_context = uitests.vscode.startup.start(options)
    uitests.vscode.startup.clear_everything(app_context)
    context.driver = app_context.driver
    context.options = app_context.options
    context.workspace_repo = None


def after_all(context):
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    uitests.vscode.application.exit(context)


def before_feature(context, feature):
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    repo = [tag for tag in feature.tags if tag.startswith("https://github.com/")]
    uitests.tools.empty_directory(context.options.workspace_folder)
    if repo:
        context.workspace_repo = repo[0]
        uitests.vscode.startup.setup_workspace(
            repo[0], context.options.workspace_folder, context.options.temp_folder
        )
    else:
        context.workspace_repo = None


def before_scenario(context, feature):
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    # We want this open so it can get captured in screenshots.
    uitests.vscode.quick_open.select_command(context, "View: Show Explorer")
    context.options = uitests.vscode.application.get_options(**context.config.userdata)


def after_scenario(context, feature):
    uitests.vscode.notifications.clear(context)
    uitests.vscode.startup.reset_workspace(context)


def after_step(context, step):
    if step.exception is not None:
        uitests.vscode.application.capture_screen(context)
