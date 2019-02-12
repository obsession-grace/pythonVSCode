# Feature: Simple maths
#   In order to do maths
#   As a developer
#   I want to increment variables

#   Scenario: easy maths
#     Given a variable set to 1
#     When I increment the variable by 1
#     Then the variable should contain 2

#   Scenario: Go to definition
#     When there is no python path in settings.json
#     Given the file 'definition.py' is open
#     When I select the text 'one()' in line 6 of file 'definition.py'
#     When I press 'right'
#     When I press 'F12'
#     Then line 3 of file 'definition.py' will be highlighted

#   Scenario Outline: much more complex stuff
#     Given a variable set to <var>
#     When I increment the variable by <increment>
#     Then the variable should contain <result>

#     Examples:
#       | var | increment | result |
#       | 100 |         5 |    105 |
#       |  99 |      1234 |   1333 |
#       |  12 |         5 |     17 |
