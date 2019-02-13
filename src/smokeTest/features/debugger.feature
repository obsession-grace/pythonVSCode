# Feature: Debugger

#    Scenario: Debug Python File
#         Given the file 'main.py' is open
#         Given the debug sidebar is open
#         When I configure the debugger
#         When I open the file 'main.py'
#         When I add a breakpoint to line 6
#         When I select the command 'View: Toggle Integrated Terminal'
#         When I press 'F5'
#         Then debugger starts
#         Then take a screenshot
#         When I open the debug console
#         Then the text 'Application launched successfully' is displayed in the debug console
#         Then take a screenshot
#         Then number of variables in variable window is 1
#         When I step over
#         Then stack frame for file 'main.py' is displayed
#         When I step over
#         Then stack frame for file 'main.py' and line 6 is displayed
#         When I step over
#         Then stack frame for file 'main.py' and line 5 is displayed
#         When I step over
#         When I step in
#         Then stack frame for file 'wow.py' and line 7 is displayed
#         When I continue
#         Then debugger stops

#    Scenario: Debug Python File and stop on entry
#         Given the file 'debugAndStopOnEntry.py' is open
#         Given the debug sidebar is open
#         When I configure the debugger
#         When stopOnEntry is true
#         When I open the file 'debugAndStopOnEntry.py'
#         When I press 'F5'
#         Then debugger starts
#         Then take a screenshot
#         Then stack frame for file 'debugAndStopOnEntry.py' and line 3 is displayed
#         When I continue
#         Then debugger stops
