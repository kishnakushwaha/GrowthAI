import json
import re

transcript_path = '/Users/kishnakushwaha/.gemini/antigravity/brain/e6a9d1a1-095e-44fd-9a23-06f8ff38c92a/.system_generated/logs/transcript.jsonl'

def inspect():
    with open(transcript_path, 'r') as f:
        for idx, line in enumerate(f):
            try:
                step = json.loads(line)
                step_idx = step.get('step_index')
                
                # Check tool calls
                tool_calls = step.get('tool_calls', [])
                if tool_calls:
                    for tc in tool_calls:
                        args = tc.get('Arguments', {})
                        if args:
                            args_str = json.dumps(args)
                            if 'geminiHelper.js' in args_str or 'wa-service/server.js' in args_str:
                                print(f"Step {step_idx}: Tool Call {tc.get('ToolName')} targeting file")
                
                content = step.get('content', '')
                if 'geminiHelper.js' in content:
                    print(f"Step {step_idx}: Content contains 'geminiHelper.js' (len: {len(content)})")
                if 'wa-service/server.js' in content:
                    print(f"Step {step_idx}: Content contains 'wa-service/server.js' (len: {len(content)})")
                
                # Check for step 2478, 2480, 2486, 2488, 2491, 2494, 2496, 2498, 2500
                if step_idx in [2478, 2480, 2486, 2488, 2491, 2494, 2496, 2498, 2500]:
                    print(f"\n--- STEP {step_idx} CONTENT PREVIEW ---")
                    print(content[:500])
                    print("---------------------------------------\n")

            except Exception as e:
                pass

if __name__ == '__main__':
    inspect()
