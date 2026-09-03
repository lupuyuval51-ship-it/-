/** Minimal Claude Messages response body, so transport tests never call the real API. */
export function claudeReply(text: string, stopReason: string = 'end_turn') {
  return {
    id: 'msg_test_only',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5',
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}
