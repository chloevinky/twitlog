#!/usr/bin/env python3
"""
TwitLog to ChatGPT Fine-tuning Converter
Converts JSONL tweet data to OpenAI ChatGPT fine-tuning format and uploads to Hugging Face
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime


class TweetConverter:
    """Converts tweet JSONL to ChatGPT fine-tuning format optimized for supervised fine-tuning"""

    def __init__(self, system_prompt: Optional[str] = None, use_custom_system: bool = False):
        """
        Initialize converter with optional custom system prompt template.

        Args:
            system_prompt: Custom system prompt template. Use {user} placeholder for username.
                          If not provided, uses default user-specific format.
            use_custom_system: If True, uses the same system_prompt for all tweets.
                              If False (default), generates user-specific system messages.
        """
        self.custom_prompt = system_prompt
        self.use_custom_system = use_custom_system

        # Default template for user-specific system messages (better for SFT)
        self.default_template = "You are @{user} on Twitter. Write tweets in your characteristic style and tone."

    def convert_tweet(self, tweet: Dict[str, str]) -> Dict:
        """
        Convert a single tweet to ChatGPT fine-tuning format optimized for supervised fine-tuning.

        The format uses user-specific system messages to help the model learn to associate
        each username with their unique writing style during supervised fine-tuning.

        Input format: {"user": "username", "text": "tweet text"}
        Output format: {"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}]}
        """
        user = tweet.get("user", "unknown")
        text = tweet.get("text", "")

        # Generate user-specific system message for better supervised fine-tuning
        if self.use_custom_system and self.custom_prompt:
            system_content = self.custom_prompt
        elif self.custom_prompt:
            # Use custom template with username substitution
            system_content = self.custom_prompt.format(user=user)
        else:
            # Use default user-specific format
            system_content = self.default_template.format(user=user)

        return {
            "messages": [
                {
                    "role": "system",
                    "content": system_content
                },
                {
                    "role": "user",
                    "content": "Write a tweet"
                },
                {
                    "role": "assistant",
                    "content": text
                }
            ]
        }

    def convert_file(self, input_path: Path, output_path: Path) -> int:
        """
        Convert an entire JSONL file to ChatGPT fine-tuning format.
        Returns the number of tweets converted.
        """
        converted_count = 0

        try:
            with open(input_path, 'r', encoding='utf-8') as infile, \
                 open(output_path, 'w', encoding='utf-8') as outfile:

                for line_num, line in enumerate(infile, 1):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        tweet = json.loads(line)
                        converted = self.convert_tweet(tweet)
                        outfile.write(json.dumps(converted, ensure_ascii=False) + '\n')
                        converted_count += 1
                    except json.JSONDecodeError as e:
                        print(f"Warning: Skipping invalid JSON on line {line_num}: {e}", file=sys.stderr)
                        continue
                    except Exception as e:
                        print(f"Warning: Error processing line {line_num}: {e}", file=sys.stderr)
                        continue

            return converted_count

        except FileNotFoundError:
            print(f"Error: Input file not found: {input_path}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Error: Failed to convert file: {e}", file=sys.stderr)
            sys.exit(1)


class HuggingFaceUploader:
    """Uploads datasets to Hugging Face"""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def upload_dataset(
        self,
        file_path: Path,
        repo_name: str,
        repo_type: str = "dataset",
        private: bool = False
    ) -> str:
        """
        Upload a JSONL file to Hugging Face as a dataset.
        Returns the dataset URL.
        """
        try:
            from huggingface_hub import HfApi, create_repo
            from huggingface_hub.utils import RepositoryNotFoundError
        except ImportError:
            print("Error: huggingface_hub is not installed. Install it with:", file=sys.stderr)
            print("  pip install huggingface_hub", file=sys.stderr)
            sys.exit(1)

        try:
            api = HfApi(token=self.api_key)

            # Create repository if it doesn't exist
            try:
                create_repo(
                    repo_id=repo_name,
                    repo_type=repo_type,
                    private=private,
                    token=self.api_key,
                    exist_ok=True
                )
                print(f"✓ Repository created/verified: {repo_name}")
            except Exception as e:
                print(f"Warning: Could not create repository: {e}", file=sys.stderr)

            # Upload the file
            url = api.upload_file(
                path_or_fileobj=str(file_path),
                path_in_repo=file_path.name,
                repo_id=repo_name,
                repo_type=repo_type,
                token=self.api_key
            )

            print(f"✓ File uploaded successfully!")
            dataset_url = f"https://huggingface.co/datasets/{repo_name}"
            return dataset_url

        except Exception as e:
            print(f"Error: Failed to upload to Hugging Face: {e}", file=sys.stderr)
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Convert TwitLog JSONL to ChatGPT fine-tuning format and upload to Hugging Face",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert with default user-specific format (optimized for supervised fine-tuning)
  python convert_to_chatgpt.py tweets.jsonl -o chatgpt_training.jsonl

  # Convert and upload to Hugging Face
  python convert_to_chatgpt.py tweets.jsonl -o chatgpt_training.jsonl \\
    --hf-token YOUR_HF_TOKEN --hf-repo username/tweet-dataset

  # Use custom template with {user} placeholder (per-user system messages)
  python convert_to_chatgpt.py tweets.jsonl -o output.jsonl \\
    --system-prompt "You are mimicking the style of Twitter user @{user}."

  # Use same system prompt for all tweets
  python convert_to_chatgpt.py tweets.jsonl -o output.jsonl \\
    --system-prompt "You are a social media content generator." \\
    --use-custom-system

Default format (no --system-prompt):
  System: "You are @username on Twitter. Write tweets in your characteristic style and tone."
  User: "Write a tweet"
  Assistant: <tweet text>
        """
    )

    parser.add_argument(
        'input_file',
        type=str,
        help='Input JSONL file with tweets (format: {"user":"...", "text":"..."})'
    )

    parser.add_argument(
        '-o', '--output',
        type=str,
        help='Output JSONL file for ChatGPT fine-tuning (default: input_file + "_chatgpt.jsonl")'
    )

    parser.add_argument(
        '--system-prompt',
        type=str,
        help='Custom system prompt template. Use {user} placeholder for username (e.g., "You are @{user}...")'
    )

    parser.add_argument(
        '--use-custom-system',
        action='store_true',
        help='Use the same system prompt for all tweets (ignore {user} placeholder)'
    )

    # Hugging Face options
    parser.add_argument(
        '--hf-token',
        type=str,
        help='Hugging Face API token'
    )

    parser.add_argument(
        '--hf-repo',
        type=str,
        help='Hugging Face repository name (e.g., "username/dataset-name")'
    )

    parser.add_argument(
        '--hf-private',
        action='store_true',
        help='Make the Hugging Face dataset private'
    )

    args = parser.parse_args()

    # Set up paths
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.with_name(input_path.stem + "_chatgpt.jsonl")

    # Convert tweets
    print(f"Converting tweets from {input_path}...")
    converter = TweetConverter(
        system_prompt=args.system_prompt,
        use_custom_system=args.use_custom_system
    )
    count = converter.convert_file(input_path, output_path)
    print(f"✓ Converted {count} tweets to ChatGPT format")
    print(f"✓ Saved to: {output_path}")

    # Show format info
    if not args.system_prompt:
        print("✓ Using user-specific system messages (optimized for supervised fine-tuning)")
    elif args.use_custom_system:
        print(f"✓ Using custom system message for all tweets")
    else:
        print(f"✓ Using custom template with user-specific messages")

    # Validate output for OpenAI
    print("\nValidating output format...")
    try:
        with open(output_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                data = json.loads(line)
                assert "messages" in data
                assert len(data["messages"]) == 3
                assert data["messages"][0]["role"] == "system"
                assert data["messages"][1]["role"] == "user"
                assert data["messages"][2]["role"] == "assistant"
        print("✓ Output file is valid for ChatGPT fine-tuning")
    except Exception as e:
        print(f"Warning: Output validation failed: {e}", file=sys.stderr)

    # Upload to Hugging Face if requested
    if args.hf_token and args.hf_repo:
        print(f"\nUploading to Hugging Face...")
        uploader = HuggingFaceUploader(args.hf_token)
        url = uploader.upload_dataset(
            file_path=output_path,
            repo_name=args.hf_repo,
            private=args.hf_private
        )
        print(f"✓ Dataset URL: {url}")
    elif args.hf_token or args.hf_repo:
        print("\nWarning: Both --hf-token and --hf-repo are required for upload", file=sys.stderr)

    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print(f"1. Upload {output_path} to OpenAI for fine-tuning:")
    print("   https://platform.openai.com/finetune")
    print("\n2. Or use the OpenAI CLI:")
    print(f"   openai api fine_tuning.jobs.create \\")
    print(f"     -t {output_path} \\")
    print(f"     -m gpt-3.5-turbo")
    print("\n3. Monitor your fine-tuning job:")
    print("   openai api fine_tuning.jobs.list")
    print("="*60)


if __name__ == "__main__":
    main()
