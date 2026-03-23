# AI Interview (Voice) Flow

## Expected experience

1. **Interviewer greets first** — When the call connects, the AI speaks the opening line (e.g. “Hello! I'm your AI interviewer today. We'll be discussing the [role] at [company]. Let's get started — could you tell me a little about yourself…”).
2. **User responds** — Candidate answers; conversation continues.
3. **Turn-taking** — AI asks one question at a time; 5–7 exchanges then wrap-up.
4. **Feedback** — After the call ends, the app sends the transcript to the Supabase `analyze-interview` edge function (Anthropic) and shows the feedback screen (score, strengths, improvements, question feedback).

## Implementation (this app)

- **Voice/call:** [Vapi](https://vapi.ai) via `@vapi-ai/react-native` (Daily.co under the hood).
- **Config:** `app/interview-session.tsx` builds an assistant with:
  - **firstMessage** — The interviewer’s opening line (the “cue” that makes the AI speak first).
  - **System prompt** — Instructs the model to speak first, then ask one question at a time and wrap up after 5–7 exchanges.
- **Env:** `EXPO_PUBLIC_VAPI_WEB_TOKEN`, `EXPO_PUBLIC_VAPI_WORKFLOW_ID` (set in `.env`, Expo env, and/or Vercel for builds).
- **Feedback:** Transcript is passed to `/interview-feedback`; that screen calls the Supabase `analyze-interview` function to get structured feedback.

## API keys and PrepGenius

The Vapi keys can be the same ones used in [PrepGenius AI](https://github.com/Asibe-Cheta/prepgenius_ai) (the web app). This app does **not** call PrepGenius’s backend; it uses Vapi directly with a **dynamic** assistant (job title, company, description, candidate background) built in `buildAssistant()`.

Ensure in this project:

- **.env** (and EAS/Expo env for builds): `EXPO_PUBLIC_VAPI_WEB_TOKEN`, `EXPO_PUBLIC_VAPI_WORKFLOW_ID`
- In the [Vapi dashboard](https://dashboard.vapi.ai): the assistant/workflow referenced by `EXPO_PUBLIC_VAPI_WORKFLOW_ID` is set to allow **overrides** so that the `firstMessage` and system prompt we pass from the app are used (interviewer speaks first).

## Testing (Expo Go vs native)

- **Expo Go:** Voice is **not** supported; the screen shows “Available in TestFlight” and does not start the call (native audio/WebRTC is required).
- **TestFlight / dev build:** Use a development build or TestFlight build to test the full flow. After “Connecting…”, you should hear the interviewer’s greeting, then respond and continue the conversation.

## If the interviewer doesn’t greet first

1. **Vapi dashboard** — Confirm the workflow/assistant is configured to use the **assistant overrides** (so `firstMessage` from the app is used).
2. **Debug panel** — On the session screen, the yellow “BUILD 23 DEBUG” panel shows connection steps (`call-start`, `participant-joined`, `track-started`, etc.). Use it to see if the call reaches “active” and whether the bot joins and sends audio.
3. **firstMessage** — It is set in `buildAssistant()` in `app/interview-session.tsx`; the system prompt also instructs the model to speak first.
