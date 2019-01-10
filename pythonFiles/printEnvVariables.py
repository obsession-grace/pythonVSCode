# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os
import json

data = {}
for item, value in os.environ.items():
    data[item] = value

print(json.dumps(data))
