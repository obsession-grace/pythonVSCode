import re

regex = r"target\s\"(\d+.\d+.\d+)\""

test_str = ("disturl \"https://atom.io/download/electron\"\n"
	"target \"3.1.3\"\n"
	"runtime \"electron\"")

matches = re.finditer(regex, test_str, re.MULTILINE)
print(next(matches).group())
print(re.fullmatch(regex, test_str, re.MULTILINE))
print(matches)
for matchNum, match in enumerate(matches, start=1):
    print(match.groups()[0])
