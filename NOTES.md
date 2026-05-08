Models
MiMo-V2.5-Pro, MiMo-V2.5, MiMo-V2.5-TTS-VoiceClone, MiMo-V2.5-TTS-VoiceDesign、MiMo-V2.5-TTS, MiMo-V2-Pro, MiMo-V2-Omni, MiMo-V2-TTS

Dedicated Base URL
Compatible with OpenAI API protocol:
https://token-plan-ams.xiaomimimo.com/v1


Compatible with Anthropic API protocol:
https://token-plan-ams.xiaomimimo.com/anthropic







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
