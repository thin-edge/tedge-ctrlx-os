// thin-edge.io flows API (ES2020 module)
// Receives dl/+/+/+/+/e/+ messages from the ctrlX Datalayer bridge
// and re-publishes them as thin-edge events on te/device/main///e/+
// The c8y mapper built-in then converts them to Cumulocity events.

const decoder = new TextDecoder();

export function onMessage(message, context) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(message.payload));
    } catch (e) {
        console.log("[ctrlx-events] Failed to parse payload: " + e);
        return [];
    }

    // Extract event type from topic: dl/device/main///e/<type>
    const topicParts = message.topic.split("/");
    const eventType = topicParts[topicParts.length - 1] ?? "ctrlx_event";

    // If payload has a nested "Text" field (from bridge MQTT Service format), use it
    const textObj = payload.Text ?? null;
    const text = textObj
        ? (typeof textObj === "object" ? JSON.stringify(textObj) : String(textObj))
        : JSON.stringify(payload);
    const time = payload.time ?? payload.Time ?? new Date().toISOString();

    // Publish in thin-edge event format — c8y mapper built-in adds source.id
    return [{
        topic: `te/device/main///e/${eventType}`,
        payload: JSON.stringify({ text, time })
    }];
}

