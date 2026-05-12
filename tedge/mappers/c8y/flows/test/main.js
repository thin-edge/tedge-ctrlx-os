const decoder = new TextDecoder();

export function onMessage(message, context) {
  const payload = JSON.parse(decoder.decode(message.payload));
  // TODO: transform payload
  return [{
    topic: message.topic,
    payload: JSON.stringify(payload),
  }];
}
