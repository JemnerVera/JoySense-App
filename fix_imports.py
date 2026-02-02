#!/usr/bin/env python3
import os
import re

forms_path = r"c:\Users\jverac\Documents\Migiva\Proyecto\Apps\JoySense\frontend\src\components\shared\forms"

# Walk through all files
count = 0
for root, dirs, files in os.walk(forms_path):
    for file in files:
        if file.endswith(('.tsx', '.ts')) and file != 'index.ts':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            # Replace imports: ../../contexts -> ../../../contexts, etc
            content = re.sub(r"from ['\"]\.\.\/\.\.\/(contexts|utils|services|hooks)",
                            r"from '../../../\1", content)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✓ Fixed: {file}")
                count += 1

print(f"✓ Total fixed: {count}")
