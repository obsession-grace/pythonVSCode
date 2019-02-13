Feature: Linters

# We will need to reload LS, its slow at picking missing modules when they are installed/uninstalled.
#    Scenario: Language server displays warnings
#         Given the module 'pylint' is not installed
#         Given the module 'requests' is not installed
#         Given the file 'pylint errors.py' is open
#         Given the setting 'python.linting.enabled' is enabled
#         Given the setting 'python.linting.pylintEnabled' is enabled
#         Given the problems panel is open
#         Then wait for 1 second
#         Then there is 1 warning in the problems panel
#         Then there is a warning with the message "unresolved import 'requests'" in the problems panel

#    Scenario: Pylint displays problems
#         Given the module 'pylint' is installed
#         Given the module 'requests' is not installed
#         Given the file 'pylint errors.py' is open
#         Given the setting 'python.linting.enabled' is enabled
#         Given the setting 'python.linting.pylintEnabled' is enabled
#         Given the problems panel is open
#         # Then wait for 1 second
#         Then there are 2 errors in the problems panel
#         Then log message 'taking screenshot'
#         Then take a screenshot
#         Then log message 'done taking screenshot'
#         # Then there is 1 warning in the problems panel
#         Then there is an error with the message "Unable to import 'requests'" in the problems panel
#         Then there is an error with the message "Unable to import 'numpy'" in the problems panel
#         # Then there is a warning with the message "unresolved import 'requests'" in the problems panel
#         Then take a screenshot

#    Scenario: Pylint + LS problems vanish upon installing module
#         Given the module 'pylint' is installed
#         Given the module 'requests' is not installed
#         Given the file 'pylint errors.py' is open
#         Given the setting 'python.linting.enabled' is enabled
#         Given the setting 'python.linting.pylintEnabled' is enabled
#         Given the problems panel is open
#         Then there are 2 errors in the problems panel
#         Then take a screenshot
#         When I close all editors
#         When I install the module 'requests'
#         When I open the file 'pylint errors.py'
#         Then there are 1 errors in the problems panel
#         Then there is an error with the message "Unable to import 'numpy'" in the problems panel
