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

### Custom System Template

Use a custom template with {user} placeholder for user-specific messages:

```bash
python convert_to_chatgpt.py tweets.jsonl \
  -o output.jsonl \
  --system-prompt "You are mimicking @{user}'s Twitter writing style."
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

The tool converts to OpenAI's fine-tuning format **optimized for supervised fine-tuning (SFT)**.

### Default Format (User-Specific System Messages)

By default, each tweet gets a user-specific system message to help the model learn to associate usernames with writing styles:

```jsonl
{"messages":[{"role":"system","content":"You are @endoverdose_ca on Twitter. Write tweets in your characteristic style and tone."},{"role":"user","content":"Write a tweet"},{"role":"assistant","content":"Ontario Residents: Request Your FREE Naloxone Kit in Under 2 Minutes!"}]}
{"messages":[{"role":"system","content":"You are @SasukeD_Uchiha on Twitter. Write tweets in your characteristic style and tone."},{"role":"user","content":"Write a tweet"},{"role":"assistant","content":"61 yards!!!!!!!"}]}
```

**Why this format is better for supervised fine-tuning:**
- Each training example includes the username in the system message
- The model learns to associate `@username` with specific writing patterns
- User prompt is simple and consistent ("Write a tweet")
- More effective for learning multiple distinct writing styles

### Custom System Messages

You can customize the system message format:

**Option 1: Custom template with {user} placeholder** (user-specific)
```bash
python convert_to_chatgpt.py tweets.jsonl \
  --system-prompt "You are mimicking the style of Twitter user @{user}."
```

**Option 2: Same system message for all tweets**
```bash
python convert_to_chatgpt.py tweets.jsonl \
  --system-prompt "You are a social media content generator." \
  --use-custom-system
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
                             [--use-custom-system] [--hf-token HF_TOKEN]
                             [--hf-repo HF_REPO] [--hf-private]
                             input_file

positional arguments:
  input_file            Input JSONL file with tweets

optional arguments:
  -h, --help            Show this help message
  -o, --output          Output JSONL file (default: input_file_chatgpt.jsonl)
  --system-prompt       Custom system prompt template (use {user} for username)
  --use-custom-system   Use same system prompt for all tweets (no {user} substitution)
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
