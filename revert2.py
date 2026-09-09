import json
import os
import sys

transcript_path = r'C:\Users\Mohamed Amr\.gemini\antigravity-ide\brain\f06f0376-3b1a-407a-8bc1-ae547e8a9d3e\.system_generated\logs\transcript.jsonl'
files_to_revert = [
    'src/features/products/types/product.types.ts',
    'src/features/products/schemas/product.schema.ts',
    'src/features/products/components/ProductForm.tsx',
    'src/features/products/components/ProductCard.tsx',
    'src/features/products/services/product.service.ts',
    'src/features/dashboard/hooks/useDashboardStats.ts',
    'src/features/products/pages/ProductListPage.tsx',
    'src/lib/i18n/config.ts'
]

calls = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
            
        if data.get('type') == 'TOOL_CALL':
            for tc in data.get('tool_calls', []):
                if tc.get('name') == 'default_api:multi_replace_file_content' or tc.get('name') == 'default_api:replace_file_content':
                    args = tc.get('arguments', {})
                    if any(args.get('TargetFile', '').replace('\\\\', '/').endswith(ftr) for ftr in files_to_revert):
                        calls.append(args)

# Reverse the calls to apply them backwards
calls.reverse()

for args in calls:
    filepath = args.get('TargetFile')
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    chunks = args.get('ReplacementChunks', [])
    if not chunks and 'ReplacementContent' in args:
        # replace_file_content format
        chunks = [args]
        
    for chunk in chunks:
        target = chunk.get('TargetContent', '')
        replacement = chunk.get('ReplacementContent', '')
        
        if replacement in content:
            content = content.replace(replacement, target)
        elif target in content:
            # Already reverted
            pass
        else:
            print('Could not find replacement block in', filepath)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print('Reverted all replacements successfully')
