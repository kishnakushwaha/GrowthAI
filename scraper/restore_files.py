import json
import os

transcript_path = '/Users/kishnakushwaha/.gemini/antigravity/brain/e6a9d1a1-095e-44fd-9a23-06f8ff38c92a/.system_generated/logs/transcript.jsonl'

def restore():
    if not os.path.exists(transcript_path):
        print("Transcript file not found!")
        return

    # Find the latest view_file contents for backend/wa-service/server.js
    with open(transcript_path, 'r') as f:
        lines = f.readlines()

    # We want to find the steps where view_file was called on wa-service/server.js
    # and geminiHelper.js
    wa_server_parts = []
    gemini_helper_content = None

    for line in lines:
        try:
            step = json.loads(line)
            # Check if this is a view_file tool output
            if step.get('type') == 'VIEW_FILE' and step.get('status') == 'DONE':
                # Check target file path
                tool_calls = step.get('tool_calls', [])
                if not tool_calls:
                    # Let's search the parent step or metadata
                    pass
                content = step.get('content', '')
                if 'backend/wa-service/server.js' in content:
                    print(f"Found wa-service/server.js view in step {step.get('step_index')}")
                    # Extract the lines from content
                    # We can clean the "<line_number>: <original_line>" formatting
                    wa_server_parts.append((step.get('step_index'), content))
                elif 'backend/engines/geminiHelper.js' in content:
                    print(f"Found geminiHelper.js view in step {step.get('step_index')}")
                    gemini_helper_content = content
        except Exception as e:
            pass

    # Save wa-service/server.js parts
    # We want the ones from the latest steps before the compaction (which was step_index ~ 2181)
    # Let's print out the found steps to choose
    print(f"Total parts found for wa-service/server.js: {len(wa_server_parts)}")
    
    # Let's reconstruct wa-service/server.js from the latest parts
    # Step 2189 had lines 1 to 800, Step 2191 had lines 800 to 849
    # Let's find them
    part1_content = None
    part2_content = None
    for idx, content in wa_server_parts:
        if "Showing lines 1 to 800" in content:
            part1_content = content
        elif "Showing lines 800 to 849" in content:
            part2_content = content

    if part1_content and part2_content:
        print("Found both parts for wa-service/server.js! Restoring...")
        restore_file(part1_content, part2_content, '/Users/kishnakushwaha/Documents/growthAI/backend/wa-service/server.js')
    else:
        print("Could not find both parts of wa-service/server.js in transcript!")
        if part1_content:
            print("Part 1 found but not Part 2.")
        if part2_content:
            print("Part 2 found but not Part 1.")

    if gemini_helper_content:
        print("Found geminiHelper.js content! Restoring...")
        restore_single_file(gemini_helper_content, '/Users/kishnakushwaha/Documents/growthAI/backend/engines/geminiHelper.js')
    else:
        print("Could not find geminiHelper.js content in transcript!")

def clean_formatted_lines(content):
    lines = content.split('\n')
    cleaned_lines = []
    start_collecting = False
    for line in lines:
        if "Showing lines" in line or "original_line" in line:
            start_collecting = True
            continue
        if start_collecting:
            # Match line numbers like "123: original code"
            match = re.match(r'^\s*\d+:\s?(.*)$', line)
            if match:
                cleaned_lines.append(match.group(1))
            elif line.strip() == "":
                cleaned_lines.append("")
    return "\n".join(cleaned_lines)

import re

def restore_file(part1, part2, target_path):
    # Clean part 1 (lines 1 to 800)
    lines1 = []
    for line in part1.split('\n'):
        match = re.match(r'^\s*(\d+):\s?(.*)$', line)
        if match:
            lines1.append((int(match.group(1)), match.group(2)))
            
    # Clean part 2 (lines 800 to 849)
    lines2 = []
    for line in part2.split('\n'):
        match = re.match(r'^\s*(\d+):\s?(.*)$', line)
        if match:
            lines2.append((int(match.group(1)), match.group(2)))
            
    # Combine and sort by line number
    all_lines = dict(lines1)
    all_lines.update(dict(lines2))
    
    sorted_lines = [all_lines[k] for k in sorted(all_lines.keys())]
    
    with open(target_path, 'w') as f:
        f.write("\n".join(sorted_lines) + "\n")
    print(f"Successfully restored wa-service/server.js to {target_path}")

def restore_single_file(content, target_path):
    lines = []
    for line in content.split('\n'):
        match = re.match(r'^\s*(\d+):\s?(.*)$', line)
        if match:
            lines.append((int(match.group(1)), match.group(2)))
            
    sorted_lines = [text for line_num, text in sorted(lines, key=lambda x: x[0])]
    
    with open(target_path, 'w') as f:
        f.write("\n".join(sorted_lines) + "\n")
    print(f"Successfully restored file to {target_path}")

if __name__ == '__main__':
    restore()
