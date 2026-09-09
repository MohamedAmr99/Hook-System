import json

transcript_path = r'C:\Users\Mohamed Amr\.gemini\antigravity-ide\brain\f06f0376-3b1a-407a-8bc1-ae547e8a9d3e\.system_generated\logs\transcript.jsonl'
files_to_restore = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
            
        # We look for the first time a file was viewed to get its original content
        if data.get('type') == 'TOOL_RESPONSE' and data.get('source') == 'SYSTEM':
            for tc in data.get('tool_calls', []):
                if tc.get('name') == 'default_api:view_file':
                    output = tc.get('response', {}).get('output', '')
                    if 'File Path: ile:///' in output:
                        # Extract file path
                        start_idx = output.find('File Path: ile:///') + len('File Path: ile:///')
                        end_idx = output.find('', start_idx)
                        path = output[start_idx:end_idx].replace('%20', ' ')
                        
                        if path not in files_to_restore:
                            # Extract lines
                            lines_section = output.split('The following code has been modified to include a line number before every line')[1]
                            lines = lines_section.split('\n')
                            original_content = []
                            for l in lines:
                                if ':' in l:
                                    original_content.append(l.split(':', 1)[1][1:])
                            
                            files_to_restore[path] = '\n'.join(original_content).strip()

print('Found original contents for:')
for p in files_to_restore:
    print(p)
    
# Now save them back
for p, content in files_to_restore.items():
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f'Restored {p}')
