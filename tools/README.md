# TwitLog to ChatGPT Converter

Convert TwitLog JSONL tweet data to OpenAI ChatGPT fine-tuning format and optionally upload to Hugging Face.

## Features

- ✅ Converts TwitLog JSONL format to OpenAI ChatGPT fine-tuning format
- ✅ Validates output for OpenAI compatibility
- ✅ Optional upload to Hugging Face datasets
- ✅ Customizable system prompts
- ✅ Robust error handling

## Installation

```bash
cd tools
pip install -r requirements.txt
```

## Usage

### Basic Conversion (No Upload)

Convert a JSONL file to ChatGPT fine-tuning format:

```bash
python convert_to_chatgpt.py tweets.jsonl -o chatgpt_training.jsonl
```

### Conversion + Hugging Face Upload

Convert and upload to Hugging Face in one step:

```bash
python convert_to_chatgpt.py tweets.jsonl \
  -o chatgpt_training.jsonl \
  --hf-token YOUR_HF_TOKEN \
  --hf-repo username/tweet-dataset
```

### Custom System Prompt

Use a custom system prompt for fine-tuning:

```bash
python convert_to_chatgpt.py tweets.jsonl \
  -o output.jsonl \
  --system-prompt "You are a social media content generator."
```

### Private Hugging Face Dataset

Make the dataset private on Hugging Face:

```bash
python convert_to_chatgpt.py tweets.jsonl \
  -o output.jsonl \
  --hf-token YOUR_HF_TOKEN \
  --hf-repo username/private-dataset \
  --hf-private
```

## Input Format

The tool expects JSONL files where each line is a JSON object with this format:

```jsonl
{"user":"endoverdose_ca","text":"Ontario Residents: Request Your FREE Naloxone Kit in Under 2 Minutes!"}
{"user":"SasukeD_Uchiha","text":"61 yards!!!!!!!"}
{"user":"ScamSkins","text":"I just woke up what happened?"}
```

## Output Format

The tool converts to OpenAI's fine-tuning format:

```jsonl
{"messages":[{"role":"system","content":"You are a tweet generator that mimics the writing style of various Twitter users."},{"role":"user","content":"Generate a tweet in the style of @endoverdose_ca"},{"role":"assistant","content":"Ontario Residents: Request Your FREE Naloxone Kit in Under 2 Minutes!"}]}
```

## Getting Your Hugging Face Token

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "write" permissions
3. Copy the token and use it with `--hf-token`

## Fine-tuning with OpenAI

After conversion, you can upload the file to OpenAI for fine-tuning:

### Via Web Interface
1. Go to https://platform.openai.com/finetune
2. Upload your converted JSONL file
3. Follow the fine-tuning wizard

### Via CLI
```bash
openai api fine_tuning.jobs.create \
  -t chatgpt_training.jsonl \
  -m gpt-3.5-turbo
```

### Monitor Your Job
```bash
openai api fine_tuning.jobs.list
openai api fine_tuning.jobs.get -i <job_id>
```

## Command-Line Options

```
usage: convert_to_chatgpt.py [-h] [-o OUTPUT] [--system-prompt SYSTEM_PROMPT]
                             [--hf-token HF_TOKEN] [--hf-repo HF_REPO]
                             [--hf-private]
                             input_file

positional arguments:
  input_file            Input JSONL file with tweets

optional arguments:
  -h, --help            Show this help message
  -o, --output          Output JSONL file (default: input_file_chatgpt.jsonl)
  --system-prompt       Custom system prompt
  --hf-token           Hugging Face API token
  --hf-repo            Hugging Face repository (e.g., "username/dataset")
  --hf-private         Make the HF dataset private
```

## Examples

### Example 1: Quick Conversion
```bash
python convert_to_chatgpt.py my_tweets.jsonl
# Output: my_tweets_chatgpt.jsonl
```

### Example 2: Full Pipeline with Upload
```bash
# 1. Convert and upload
python convert_to_chatgpt.py scraped_tweets.jsonl \
  --hf-token hf_xxxxxxxxxxxxx \
  --hf-repo myusername/tweet-training-data \
  --hf-private

# 2. The dataset is now available at:
# https://huggingface.co/datasets/myusername/tweet-training-data

# 3. Fine-tune with OpenAI
openai api fine_tuning.jobs.create \
  -t scraped_tweets_chatgpt.jsonl \
  -m gpt-3.5-turbo
```

## Troubleshooting

### "huggingface_hub is not installed"
```bash
pip install huggingface_hub
```

### "Authentication token not found"
Make sure your HF token has write permissions.

### "Invalid JSON on line X"
Check your input file for malformed JSON. Each line must be valid JSON.

## License

Same as parent project (see LICENSE file in root directory)
