import json
import re

transcript_path = '/Users/kishnakushwaha/.gemini/antigravity/brain/e6a9d1a1-095e-44fd-9a23-06f8ff38c92a/.system_generated/logs/transcript.jsonl'

def run():
    with open(transcript_path, 'r') as f:
        for line in f:
            try:
                step = json.loads(line)
                content = step.get('content', '')
                if 'backend/wa-service/server.js' in content:
                    lines_match = re.search(r'Showing lines \d+ to \d+', content)
                    show_str = lines_match.group(0) if lines_match else "No 'Showing lines'"
                    print(f"Step {step.get('step_index')}: {show_str}, len={len(content)}")
            except Exception as e:
                pass

if __name__ == '__main__':
    run()
