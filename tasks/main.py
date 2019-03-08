from invoke import task
from .downloader import (
    download_vscode,
    download_chrome_driver as download_chrome_drv,
)


@task(name="download")
def download_all(ctx, destination=".vscode-smoke", channel="stable"):
    """
    Downloads VS Code (stable/insiders) and chrome driver.
        :param ctx:
        :param destination: Destination directory.
    """
    download_vscode(destination, channel)
    download_chrome_drv(destination, channel)


@task(name="download_vsc")
def download_vsc(ctx, destination=".vscode-smoke", channel="stable"):
    """
    Downloads VS Code (stable/insiders).
        :param ctx:
        :param destination: Destination directory.
    """
    download_vscode(destination, channel)


@task(name="download_chrome_driver")
def download_chrome_driver(ctx, destination=".vscode-smoke", channel="stable"):
    """
    Downloads the Chrome Driver.
        :param ctx:
        :param destination: Destination directory.
    """
    download_chrome_drv(destination, channel)
