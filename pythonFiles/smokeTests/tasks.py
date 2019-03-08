import os.path
from invoke import task
from .vscode.download import (
    download_vscode,
    download_chrome_driver as download_chrome_drv,
)
from .bootstrap.main import build_extension
from .vscode.application import VSCode, get_options


@task(name="download")
def download_all(ctx, destination=".vscode-smoke", channel="stable"):
    """Downloads VS Code (stable/insiders) and chrome driver.

    The channel defines the channel for VSC (stable or insiders).
    """
    destination = os.path.join(destination, "vscode")
    download_vscode(destination, channel)
    download_chrome_drv(destination, channel)


@task(name="download_vsc")
def download_vsc(ctx, destination=".vscode-smoke", channel="stable"):
    """
    Downloads VS Code (stable/insiders).
        :param ctx:
        :param destination: Destination directory.
    """
    destination = os.path.join(destination, "vscode")
    download_vscode(destination, channel)


@task(name="download_chrome_driver")
def download_chrome_driver(ctx, destination=".vscode-smoke", channel="stable"):
    """
    Downloads the Chrome Driver.
        :param ctx:
        :param destination: Destination directory.
    """
    destination = os.path.join(destination, "vscode")
    download_chrome_drv(destination, channel)


@task(name="build_smoke_extension")
def download_chrome_driver(ctx):
    """
    Builds the smoke test extension.
        :param ctx:
    """
    build_extension()


@task(name="smoke")
def smoke(
    ctx, destination=".vscode-smoke", channel="stable", vsix="ms-python-insiders.vsix"
):
    """
    Starts the smoke tests
        :param ctx:
    """
    vsix = os.path.abspath(vsix)
    options = get_options(destination, vsix)
    print(options)
    VSCode.start(options=options)
