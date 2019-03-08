import sys
import os.path

current_dir = os.path.dirname(os.path.realpath(__file__))
python_files_dir = os.path.abspath(os.path.join(current_dir, "..", "pythonFiles")) # noqa

sys.path.append(python_files_dir)
from smokeTests.tasks import *

# from .main import download_vsc, download_chrome_driver, download_all  # noqa
from .release import news, tpn
