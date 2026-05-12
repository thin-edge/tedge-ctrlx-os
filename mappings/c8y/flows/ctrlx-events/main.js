// thin-edge.io flows API (ES2020 module)
// Receives te/+/+/+/+/e/+ messages and forwards them as
// Cumulocity events to c8y/event/events/create

const decoder = new TextDecoder();

export function onMessage(message, context) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(message.payload));
    } catch (e) {
        console.log("[ctrlx-events] Failed to parse payload: " + e);
        return [];
    }

    // Derive device context key from topic
    // e.g. "te/device/main///e/ctrlx_event" → "device/main//"
    const topicParts = message.topic.split("/");
    const deviceKey = topicParts.slice(1, 5).join("/");
    const eventTypeFromTopic = topicParts[6] ?? "ctrlx_event";

    // Resolve Cumulocity device ID from mapper context
    const deviceInfo = context.mapper.get(deviceKey) ?? {};
    const deviceId = deviceInfo["@id"];
    if (!deviceId) {
        console.log("[ctrlx-events] No device ID found for: " + deviceKey);
        return [];
    }

    // If payload has a nested "Text" field (from bridge service MQTT Service format),
    // use it directly; otherwise treat the whole payload as the event text
    const text = payload.Text
        ? (typeof payload.Text === "object" ? JSON.stringify(payload.Text) : String(payload.Text))
        : JSON.stringify(payload);

    const time = payload.time ?? payload.Time ?? new Date().toISOString();
    const type = payload.type ?? eventTypeFromTopic;

    return [{
        topic: "c8y/event/events/create",
        payload: JSON.stringify({
            text,
            time,
            type,
            source: { id: deviceId }
        })
    }];
}

