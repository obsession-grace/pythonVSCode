# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import base64
import os
import shutil
import sys
import tempfile
import traceback

from selenium import webdriver

import uitests.bootstrap
import uitests.report
import uitests.tools
from dataclasses import dataclass

from . import quick_open, utils


@dataclass
class Options:
    executable_dir: str
    user_dir: str
    extensions_dir: str
    extension_path: str
    workspace_folder: str
    temp_folder: str
    screenshots_dir: str
    embed_screenshots: bool
    output: str
    python_path: str
    python_type: str
    python_version: str


def get_options(
    destination=".vscode-test",
    vsix="ms-python-insiders.vsix",
    embed_screenshots=True,
    output="file",
    channel="stable",
    python_path=sys.executable,
    python_type=None,
    python_version=f"{sys.version_info[0]}.{sys.version_info[1]}",
):
    """Gets the options used for smoke tests."""
    destination = os.path.abspath(destination)
    options = Options(
        os.path.join(destination, channel),
        os.path.join(destination, "user"),
        os.path.join(destination, "extensions"),
        vsix,
        os.path.join(destination, "workspace folder"),
        os.path.join(destination, "temp"),
        os.path.join(destination, "screenshots"),
        embed_screenshots,
        output,
        python_path,
        python_type,
        python_version,
    )
    os.makedirs(options.extensions_dir, exist_ok=True)
    os.makedirs(options.user_dir, exist_ok=True)
    os.makedirs(options.workspace_folder, exist_ok=True)
    os.makedirs(options.temp_folder, exist_ok=True)
    os.makedirs(options.screenshots_dir, exist_ok=True)
    return options


def setup_environment(dirs):
    """Setup environment for smoke tests."""
    os.environ["PATH"] += os.pathsep + dirs.executable_dir


def uninstall_extension(options):
    """Uninstalls extensions from smoke tests copy of VSC."""
    shutil.rmtree(options.extensions_dir, ignore_errors=True)


def install_extension(options):
    """Installs extensions into smoke tests copy of VSC."""
    uninstall_extension(options)
    env = {"ELECTRON_RUN_AS_NODE": "1"}
    command = [
        utils.get_binary_location(options.executable_dir),
        utils.get_cli_location(options.executable_dir),
        f"--user-data-dir={options.user_dir}",
        f"--extensions-dir={options.extensions_dir}",
        f"--install-extension={options.extension_path}",
    ]
    uitests.tools.run_command(
        command, progress_message="Installing Python Extension", env=env
    )

    bootstrap_extension = uitests.bootstrap.main.get_extension_path()
    command = [
        utils.get_binary_location(options.executable_dir),
        utils.get_cli_location(options.executable_dir),
        f"--user-data-dir={options.user_dir}",
        f"--extensions-dir={options.extensions_dir}",
        f"--install-extension={bootstrap_extension}",
    ]
    uitests.tools.run_command(
        command, progress_message="Installing Smoke Test Extension", env=env
    )


def launch_extension(options):
    """Launches the smoke tests copy of VSC."""
    chrome_options = webdriver.ChromeOptions()
    # Remember to remove the leading `--`.
    # Chromedriver will add `--` for ALL arguments.
    # I.e. arguments without a leading `--` are not supported.
    for arg in [
        f"user-data-dir={options.user_dir}",
        f"extensions-dir={options.extensions_dir}",
        f"folder-uri=file:{options.workspace_folder}",
        "skip-getting-started",
        "skip-release-notes",
        "sticky-quickopen",
        "disable-telemetry",
        "disable-updates",
        "disable-crash-reporter",
    ]:
        chrome_options.add_argument(arg)

    chrome_options.binary_location = utils.get_binary_location(options.executable_dir)
    driver = webdriver.Chrome(options=chrome_options)
    return driver


def exit(context):
    try:
        quick_open.select_command(context, "Close Window")
    except Exception:
        pass
    try:
        context.driver.close()
    except Exception:
        pass
    try:
        context.driver.quit()
    except Exception:
        pass


def reload(self):
    raise NotImplementedError()


def capture_screen(context):
    if context.options.output != "file":
        return

    if context.options.embed_screenshots:
        screenshot = context.driver.get_screenshot_as_base64()
        uitests.report.PrettyCucumberJSONFormatter.instance.attach_image(screenshot)
    else:
        filename = tempfile.NamedTemporaryFile(prefix="screen_capture_")
        filename = f"{os.path.basename(filename.name)}.png"
        filename = os.path.join(context.options.screenshots_dir, filename)
        context.driver.save_screenshot(filename)
        html = f'<a href="{filename}" target="_blank">Screen Shot</a>'
        html = base64.b64encode(html.encode("utf-8")).decode("utf-8")

        uitests.report.PrettyCucumberJSONFormatter.instance.attach_html(html)


def capture_exception(context, info=None):
    if info is None or info.exc_traceback is None or info.exception is None:
        return

    formatted_ex = traceback.format_exception(
        type(info.exception), info.exception, info.exc_traceback
    )
    html = f"<h>Error</h><p>{formatted_ex}</p>"
    html = base64.b64encode(html.encode("utf-8")).decode("utf-8")

    uitests.report.PrettyCucumberJSONFormatter.instance.attach_html(html)
