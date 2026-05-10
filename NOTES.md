My available Models names:
MiMo-V2.5-Pro, MiMo-V2.5, MiMo-V2.5-TTS-VoiceClone, MiMo-V2.5-TTS-VoiceDesign、MiMo-V2.5-TTS, MiMo-V2-Pro, MiMo-V2-Omni, MiMo-V2-TTS

for calls
mimo-v2.5-pro, mimo-v2.5, mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone, mimo-v2-pro, mimo-v2-omni, mimo-v2-tts, mimo-v2-flash


<option value="mimo-v2.5-pro">mimo-v2.5-pro</option>
            <option value="mimo-v2.5">mimo-v2.5</option>
            <option value="mimo-v2-pro">mimo-v2-pro</option>
           <option value="mimo-v2-omni">mimo-v2-omni</option>

Dedicated Base URL
Compatible with OpenAI API protocol:
https://token-plan-ams.xiaomimimo.com/v1


Compatible with Anthropic API protocol:
https://token-plan-ams.xiaomimimo.com/anthropic



todo.md
add skills management: 
add option for user to add and manage skills and let the ai help formulate them most optimized. fex here is an exMple of a skill that could be predefined preset:
---


name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the results both qualitatively and quantitatively
  - While the runs happen in the background, draft some quantitative evals if there aren't any (if there are some, you can either use as is or modify if you feel something needs to change about them). Then explain them to the user (or if they already existed, explain the ones that already exist)
  - Use the `eval-viewer/generate_review.py` script to show the user the results for them to look at, and also let them look at the quantitative metrics
- Rewrite the skill based on feedback from the user's evaluation of the results (and also if there are any glaring flaws that become apparent from the quantitative benchmarks)
- Repeat until you're satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and then jump in and help them progress through these stages. So for instance, maybe they're like "I want to make a skill for X". You can help narrow down what they mean, write a draft, write the test cases, figure out how they want to evaluate, run all the prompts, and repeat.

On the other hand, maybe they already have a draft of the skill. In this case you can go straight to the eval/iterate part of the loop.

Of course, you should always be flexible and if the user is like "I don't need to run a bunch of evaluations, just vibe with me", you can do that instead.

Then after the skill is done (but again, the order is flexible), you can also run the skill description improver, which we have a whole separate script for, to optimize the triggering of the skill.

Cool? Cool.

## Communicating with the user

The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. If you haven't heard (and how could you, it's only very recently that it started), there's a trend now where the power of Claude is inspiring plumbers to open up their terminals, parents and grandparents to google "how to install npm". On the other hand, the bulk of users are probably fairly computer-literate.

So please pay attention to context cues to understand how to phrase your communication! In the default case, just to give you some idea:

- "evaluation" and "benchmark" are borderline, but OK
- for "JSON" and "assertion" you want to see serious cues from the user that they know what those things are before using them without explaining them

It's OK to briefly explain terms if you're in doubt, and feel free to clarify terms with a short definition if you're unsure if the user will get it.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding to the next step.

1. What should this skill enable Claude to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works? Skills with objectively verifiable outputs (file transforms, data extraction, code generation, fixed workflow steps) benefit from test cases. Skills with subjective outputs (writing style, art) often don't need them. Suggest the appropriate default based on the skill type, but let the user decide.

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until you've got this part ironed out.

Check available MCPs - if useful for research (searching docs, finding similar skills, looking up best practices), research in parallel via subagents if available, otherwise inline. Come prepared with context to reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier
- **description**: When to trigger, what it does. This is the primary triggering mechanism - include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Note: currently Claude has a tendency to "undertrigger" skills -- to not use them when they'd be useful. To combat this, please make the skill descriptions a little bit "pushy". So for instance, instead of "How to build a simple fast dashboard to display internal Anthropic data.", you might write "How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill :)**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** - As needed (unlimited, scripts can execute without loading)

These word counts are approximate and you can feel free to go longer if needed.

**Key patterns:**
- Keep SKILL.md under 500 lines; if you're approaching this limit, add an additional layer of hierarchy along with clear pointers about where the model using the skill should go next to follow up.
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude reads only the relevant reference file.

#### Principle of Lack of Surprise

This goes without saying, but skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described. Don't go along with requests to create misleading skills or skills designed to facilitate unauthorized access, data exfiltration, or other malicious activities. Things like a "roleplay as an XYZ" are OK though.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats** - You can do it like this:
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern** - It's useful to include examples. You can format them like this (but if "Input" and "Output" are in the examples you might want to deviate a little):
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed musty MUSTs. Use theory of mind and try to make the skill general and not super-narrow to specific examples. Start by writing a draft and then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user: [you don't have to use this exact language] "Here are a few test cases I'd like to try. Do these look right, or do you want to add more?" Then run them.

Save test cases to `evals/evals.json`. Don't write assertions yet — just the prompts. You'll draft assertions in the next step while the runs are in progress.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema (including the `assertions` field, which you'll add later).

## Running and evaluating test cases

This section is one continuous sequence — don't stop partway through. Do NOT use `/skill-test` or any other testing skill.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory (`eval-0/`, `eval-1/`, etc.). Don't create all of this upfront — just create directories as you go.

### Step 1: Spawn all runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents in the same turn — one with the skill, one without. This is important: don't spawn the with-skill runs first and then come back for baselines later. Launch everything at once so it all finishes around the same time.

**With-skill run:**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline run** (same prompt, but the baseline depends on context):
- **Creating a new skill**: no skill at all. Same prompt, no skill path, save to `without_skill/outputs/`.
- **Improving an existing skill**: the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline subagent at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case (assertions can be empty for now). Give each eval a descriptive name based on what it's testing — not just "eval-0". Use this name for the directory too. If this iteration uses new or modified eval prompts, create these files for each new eval directory — don't assume they carry over from previous iterations.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2: While runs are in progress, draft assertions

Don't just wait for the runs to finish — you can use this time productively. Draft quantitative assertions for each test case and explain them to the user. If assertions already exist in `evals/evals.json`, review them and explain what they check.

Good assertions are objectively verifiable and have descriptive names — they should read clearly in the benchmark viewer so someone glancing at the results immediately understands what each one checks. Subjective skills (writing style, design quality) are better evaluated qualitatively — don't force assertions onto things that need human judgment.

Update the `eval_metadata.json` files and `evals/evals.json` with the assertions once drafted. Also explain to the user what they'll see in the viewer — both the qualitative outputs and the quantitative benchmark.

### Step 3: As runs complete, capture timing data

When each subagent task completes, you receive a notification containing `total_tokens` and `duration_ms`. Save this data immediately to `timing.json` in the run directory:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

This is the only opportunity to capture this data — it comes through the task notification and isn't persisted elsewhere. Process each notification as it arrives rather than trying to batch them.

### Step 4: Grade, aggregate, and launch the viewer

Once all runs are done:

1. **Grade each run** — spawn a grader subagent (or grade inline) that reads `agents/grader.md` and evaluates each assertion against the outputs. Save results to `grading.json` in each run directory. The grading.json expectations array must use the fields `text`, `passed`, and `evidence` (not `name`/`met`/`details` or other variants) — the viewer depends on these exact field names. For assertions that can be checked programmatically, write and run a script rather than eyeballing it — scripts are faster, more reliable, and can be reused across iterations.

2. **Aggregate into benchmark** — run the aggregation script from the skill-creator directory:
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   This produces `benchmark.json` and `benchmark.md` with pass_rate, time, and tokens for each configuration, with mean ± stddev and the delta. If generating benchmark.json manually, see `references/schemas.md` for the exact schema the viewer expects.
Put each with_skill version before its baseline counterpart.

3. **Do an analyst pass** — read the benchmark data and surface patterns the aggregate stats might hide. See `agents/analyzer.md` (the "Analyzing Benchmark Results" section) for what to look for — things like assertions that always pass regardless of skill (non-discriminating), high-variance evals (possibly flaky), and time/token tradeoffs.

4. **Launch the viewer** with both qualitative outputs and quantitative data:
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

   **Cowork / headless environments:** If `webbrowser.open()` is not available or the environment has no display, use `--static <output_path>` to write a standalone HTML file instead of starting a server. Feedback will be downloaded as a `feedback.json` file when the user clicks "Submit All Reviews". After download, copy `feedback.json` into the workspace directory for the next iteration to pick up.

Note: pleas



Documentation
API Reference
Chat
OpenAI API
OpenAI API Compatibility

Request Address
https://api.xiaomimimo.com/v1/chat/completions

Request Headers
The API supports the following two authentication methods. Please choose one and add it to the request headers:

Method 1: api-key field authentication, format:
api-key: $MIMO_API_KEY
Content-Type: application/json

Method 2: Authorization: Bearer authentication, format:
Authorization: Bearer $MIMO_API_KEY
Content-Type: application/json

Request body
messages
array
Required
The current conversation message list.


Developer message · object

System message · object

User message · object

Assistant message · object

Tool message · object

Developer-provided instructions that the model should follow, regardless of messages sent by the user.
messages.content
string | array
Required
The contents of the system message.


Text content · string

Array of content parts · array

The contents of the system message.
messages.role
string
Required
Role of the message author.
Available options: system
messages.name
string
An optional name for the participant. Provides the model information to differentiate between participants of the same role.
model
string
Required
Model ID is used to generate the response.
Available options: mimo-v2.5-pro, mimo-v2.5, mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone, mimo-v2-pro, mimo-v2-omni, mimo-v2-tts, mimo-v2-flash
audio
object
Parameters for audio output. For details, please refer to Speech Synthesis.
Note: To generate audio, you must add a message with role set to assistant, which needs to specify the text for speech synthesis. Additionally, when using the mimo-v2.5-tts-voicedesign model, a message with the role of user is required. For detailed usage, please refer to Speech Synthesis.
Currently, only the mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are supported.
audio.format
string
Default: wav
Specifies the output audio format. Default: wav, or pcm when you set stream: true.
Passing in pcm or pcm16 both indicate specifying the use of the pcm16 format.
Available options: wav, mp3, pcm, pcm16
audio.voice
string
The voice ID of the built-in voice or the base64 encoding of the audio sample.
mimo-v2.5-tts, mimo-v2-tts: This field is optional and only supports using built-in voices, with the default value being mimo_default
mimo-v2.5-tts-voiceclone: This field is required and only supports passing in the base64 encoding of audio samples, and only supports passing in audio sample files in mp3 and wav formats
mimo-v2.5-tts-voicedesign does not support this field
Available options:
mimo-v2-tts: mimo_default, default_en, default_zh
mimo-v2.5-tts: mimo_default, 冰糖, 茉莉, 苏打, 白桦, Mia, Chloe, Milo, Dean
frequency_penalty
number | null
Default: 0
Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
Required range: [-2.0, 2.0]
max_completion_tokens
integer | null
An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens.
mimo-v2-flash: default 65536
mimo-v2.5-pro, mimo-v2-pro: default 131072
mimo-v2.5, mimo-v2-omni: default 32768
mimo-v2.5-tts, mimo-v2.5-tts-voiceclone, mimo-v2.5-tts-voicedesign, mimo-v2-tts: default 8192, required range is [1, 8192]
Required range: [1, 131072]
presence_penalty
number | null
Default: 0
Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
Required range: [-2.0, 2.0]
response_format
object
An object specifying the format that the model must output.
mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are not supported.

Text · object

JSON object · object
Default response format. Used to generate text responses.
response_format.type
string
Required
The type of response format being defined. Always text.
stop
string | array | null
Default: null
Up to 4 sequences where the API will stop generating further tokens. The returned text will not contain the stop sequence.
mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are not supported.
stream
boolean | null
Default: false
If set to true, the model response data will be streamed to the client as it is generated using server-sent events.
thinking
object
This parameter is used to control whether the model enables the chain of thought.
Note: During the multi-turn tool calls process in thinking mode, the model returns a reasoning_content field alongside tool_calls. To continue the conversation, it is recommended to keep all previous reasoning_content in the messages array for each subsequent request to achieve the best performance.
mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are not supported.
thinking.type
string
Required
Whether to enable the chain of thought.
mimo-v2-flash: default disabled
mimo-v2.5-pro, mimo-v2.5, mimo-v2-pro, mimo-v2-omni: default enabled
Available options: enabled, disabled
temperature
number
What sampling temperature to use, between 0 and 1.5. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or top_p but not both.
mimo-v2-flash: default 0.3
mimo-v2.5-pro, mimo-v2.5, mimo-v2-pro, mimo-v2-omni: default 1.0
mimo-v2.5-tts, mimo-v2.5-tts-voiceclone, mimo-v2.5-tts-voicedesign, mimo-v2-tts: default 0.6
Required range: [0, 1.5]
tool_choice
string
Controls how the model selects a tool.
Note: When a value other than auto is passed to tool_choice, the backend will remove this field by default, and the model response behavior will still be equivalent to the auto mode (this logic is subject to future adjustments).
mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are not supported.
Available options: auto
tools
array
A list of tools the model may call. You can provide function tools.
Note: During the multi-turn tool calls process in thinking mode, the model returns a reasoning_content field alongside tool_calls. To continue the conversation, it is recommended to keep all previous reasoning_content in the messages array for each subsequent request to achieve the best performance.
mimo-v2.5-tts, mimo-v2.5-tts-voicedesign, mimo-v2.5-tts-voiceclone and mimo-v2-tts models are not supported.


Function tool · object

Web search tool · object

A function tool that can be used to generate a response.
tools.function
object
Required
tools.function.name
string
Required
The name of the tool function. Must be a-z, A-Z, 0-9, or contain underscores (_) and dashes (-), with a maximum length of 64.
Required string length: 1 - 64
tools.function.description
string
A description of what the function does, used by the model to choose when and how to call the function.
tools.function.parameters
object
The parameters the functions accept, described as a JSON Schema object.
Omitting parameters defines a function with an empty parameter list.
tools.function.strict
boolean
Default: false
Whether to enable strict schema adherence when generating the function call. If set to true, the model will follow the exact schema defined in the parameters field. Only a subset of JSON Schema is supported when strict is true.
tools.type
string
Required
Tool type. Currently, only function is supported.
top_p
number
Default: 0.95
The probability threshold for nucleus sampling, which controls the diversity of the text that the model generates. A higher top_p value results in more diverse text. A lower top_p value results in more deterministic text.
Because both temperature and top_p control the diversity of the generated text, we recommend that you set only one of them.
Required range: [0.01, 1.0]
Chat response object (non-streaming output)
choices
array
A list of chat completion choices.
choices.finish_reason
string
The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, tool_calls if the model called a tool, content_filter if content was omitted due to a flag from our content filters, repetition_truncation if the model detects repetition.
choices.index
integer
The index of the choice in the list of choices.
choices.message
object
A chat completion message generated by the model.
choices.message.content
string
The contents of the message.
choices.message.reasoning_content
string
The reasoning contents of the assistant message, before the final answer.
choices.message.role
string
The role of the author of this message.
choices.message.tool_calls
array
After a function call is initiated, the model returns the tool to be called and the parameters that are Required for the call. This parameter can contain one or more tool response objects.

Function tool call · object
A call to a function tool created by the model.
choices.message.tool_calls.function
object
The function that the model called.
choices.message.tool_calls.function.arguments
string
The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function.
choices.message.tool_calls.function.name
string
The name of the function to call.
choices.message.tool_calls.id
string
The ID of the tool call.
choices.message.tool_calls.type
string
The type of the tool. Currently, only function is supported.
choices.message.annotations
array
After web search, the model returns annotations for all referenced URLs.

web_search tool call · object
A call to a web search tool created by the model.
choices.message.annotations.logo_url
string
Logo url.
choices.message.annotations.publish_time
string
Publish time.
choices.message.annotations.site_name
string
Site name.
choices.message.annotations.summary
string
Summary.
choices.message.annotations.title
string
Title.
choices.message.annotations.type
string
Type.
choices.message.annotations.url
string
Url.
choices.message.error_message
string
Error message of web search.
choices.message.audio
object
If the audio output is requested, this object contains data about the audio response from the model.
choices.message.audio.id
string
Unique identifier for this audio response.
choices.message.audio.data
string
Base64 encoded audio bytes generated by the model, in the format specified in the request.
choices.message.audio.expires_at
number | null
The Unix timestamp (in seconds) for when this audio response expires. Currently always null.
choices.message.audio.transcript
string | null
Transcript of the audio generated by the model. Currently always null.
created
integer
The Unix timestamp (in seconds) of when the chat completion was created.
id
string
A unique identifier for the chat completion.
model
string
The model to generate the completion.
object
string
The object type, which is always chat.completion.
usage
object | null
Usage statistics for the completion request.
usage.completion_tokens
integer
Number of tokens in the generated completion.
usage.prompt_tokens
integer
Number of tokens in the prompt.
usage.total_tokens
integer
Total number of tokens used in the request (prompt + completion).
usage.completion_tokens_details
object
Breakdown of tokens used in a completion.
usage.completion_tokens_details.reasoning_tokens
integer
Tokens generated by the model for reasoning.
usage.prompt_tokens_details
object
Breakdown of tokens used in the prompt.
usage.prompt_tokens_details.cached_tokens
integer
Number of tokens served from cache.
usage.prompt_tokens_details.audio_tokens
integer
Audio input tokens present in the prompt.
usage.prompt_tokens_details.image_tokens
integer
Image input tokens present in the prompt.
usage.prompt_tokens_details.video_tokens
integer
Video input tokens present in the prompt.
usage.web_search_usage
object
Detailed usage of the web search API.
usage.web_search_usage.tool_usage
integer
Number of API calls in web search.
usage.web_search_usage.page_usage
integer
Number of web pages returned by the web search API.
Chat response chunk object (streaming output)
choices
array
A list of chat completion choices.
choices.delta
object
A chat completion delta generated by streamed model responses.
choices.delta.content
string
The contents of the chunk message.
choices.delta.reasoning_content
string
The reasoning contents of the assistant message, before the final answer.
choices.delta.role
string
The role of the author of this message.
choices.delta.tool_calls
array
The tools to be called by the model and the parameters Required for the calls. It can contain one or more tool response objects.
choices.delta.tool_calls.index
integer
The index of the called tool in the tool_calls list, starting from 0.
choices.delta.tool_calls.function
object
The function to be called.
choices.delta.tool_calls.function.arguments
string
The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function.
choices.delta.tool_calls.function.name
string
The name of the function to call.
choices.delta.tool_calls.id
string
The ID of the tool call.
choices.delta.tool_calls.type
string
The type of the tool. Currently, only function is supported.
choices.delta.annotations
array
After web search, the model returns annotations for all referenced URLs.

web_search tool call · object
A call to a web search tool created by the model.
choices.delta.annotations.logo_url
string
Logo url.
choices.delta.annotations.publish_time
string
Publish time.
choices.delta.annotations.site_name
string
Site name.
choices.delta.annotations.summary
string
Summary.
choices.delta.annotations.title
string
Title.
choices.delta.annotations.type
string
Type.
choices.delta.annotations.url
string
Url.
choices.delta.error_message
string
Error message of web search.
choices.delta.audio
object | null
If the audio output modality is requested, this object contains data about the audio response from the model.
choices.delta.audio.id
string
Unique identifier for this audio response.
choices.delta.audio.data
string
Base64 encoded audio bytes generated by the model, in the format specified in the request.
choices.delta.audio.expires_at
number | null
The Unix timestamp (in seconds) for when this audio response expires. Currently always null.
choices.delta.audio.transcript
string | null
Transcript of the audio generated by the model. Currently always null.
choices.finish_reason
string | null
The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, tool_calls if the model called a tool, content_filter if content was omitted due to a flag from our content filters, repetition_truncation if the model detects repetition.
choices.index
integer
The index of the choice in the list of choices.
created
integer
The Unix timestamp (in seconds) of when the chat completion was created. Each chunk has the same timestamp.
id
string
A unique identifier for the chat completion. Each chunk has the same ID.
model
string
The model to generate the completion.
object
string
The object type, which is always chat.completion.chunk.
usage
object | null
Usage statistics for the completion request.
usage.completion_tokens
integer
Number of tokens in the generated completion.
usage.prompt_tokens
integer
Number of tokens in the prompt.
usage.total_tokens
integer
Total number of tokens used in the request (prompt + completion).
usage.completion_tokens_details
object
Breakdown of tokens used in a completion.
usage.completion_tokens_details.reasoning_tokens
integer
Tokens generated by the model for reasoning.
usage.prompt_tokens_details
object
Breakdown of tokens used in the prompt.
usage.prompt_tokens_details.cached_tokens
integer
Number of tokens served from cache.
usage.prompt_tokens_details.audio_tokens
integer
Audio input tokens present in the prompt.
usage.prompt_tokens_details.image_tokens
integer
Image input tokens present in the prompt.
usage.prompt_tokens_details.video_tokens
integer
Video input tokens present in the prompt.
usage.web_search_usage
object
Detailed usage of the web search API.
usage.web_search_usage.tool_usage
integer
Number of API calls in web search.
usage.web_search_usage.page_usage
integer
Number of web pages returned by the web search API.
curl
python



default

streaming

function call

web search

image input

audio input

video input

speech synthesis

structured output

deep thinking

curl --location --request POST 'https://api.xiaomimimo.com/v1/chat/completions' \
--header "api-key: $MIMO_API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "model": "mimo-v2.5-pro",
    "messages": [
        {
            "role": "system",
            "content": "You are MiMo, an AI assistant developed by Xiaomi. Today is date: Tuesday, December 16, 2025. Your knowledge cutoff date is December 2024."
        },
        {
            "role": "user",
            "content": "please introduce yourself"
        }
    ],
    "max_completion_tokens": 1024,
    "temperature": 1.0,
    "top_p": 0.95,
    "stream": false,
    "stop": null,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "thinking": {
        "type": "disabled"
    }
}'
response



default

streaming

function call

web search

image input

audio input

video input

speech synthesis

structured output

deep thinking

{
    "id": "8b51f9e0515949cb8207fbd35ea6ea5c",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "Hello! I'm MiMo, Xiaomi's AI assistant created by the Xiaomi LLM-Core team. I'm here to chat, help answer questions, and assist with various tasks—whether it's providing information, brainstorming ideas, or just having a friendly conversation. Feel free to ask me anything, and I'll do my best to help! 😊",
                "role": "assistant",
                "tool_calls": null
            }
        }
    ],
    "created": 1776848906,
    "model": "mimo-v2.5-pro",
    "object": "chat.completion",
    "usage": {
        "completion_tokens": 72,
        "prompt_tokens": 57,
        "total_tokens": 129,
        "completion_tokens_details": {
            "reasoning_tokens": 0
        },
        "prompt_tokens_details": null
    }
}
MiMo-V2-Flash Release 2025/12/16
Anthropic API
