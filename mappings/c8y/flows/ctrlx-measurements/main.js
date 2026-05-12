// thin-edge.io flows API (ES2020 module)
// Receives dl/+/+/+/+/m/+ messages from the ctrlX Datalayer bridge
// and re-publishes them as thin-edge measurements on te/device/main///m/+
// The c8y mapper built-in then converts them to Cumulocity measurements
// (adding source.id automatically — no device ID lookup needed here).

const decoder = new TextDecoder();

const SKIP_KEYS = ["unit", "time", "_TOPIC_LEVEL_", "_CONTEXT_DATA_"];

export function onMessage(message, context) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(message.payload));
    } catch (e) {
        console.log("[ctrlx-measurements] Failed to parse payload: " + e);
        return [];
    }

    // Extract field name from topic: dl/device/main///m/<field_name>
    const topicParts = message.topic.split("/");
    const fieldName = topicParts[topicParts.length - 1];
    const unit = payload.unit != null ? String(payload.unit) : "";  // kept for potential future use
    const time = payload.time != null ? String(payload.time) : new Date().toISOString();

    // Build thin-edge measurement: { "<fragment>": { "<series>": <number> } }
    const measurementKeys = Object.keys(payload).filter(k => SKIP_KEYS.indexOf(k) === -1);
    if (measurementKeys.length === 0) return [];

    const fragments = {};
    for (const key of measurementKeys) {
        const val = payload[key];
        if (typeof val === "number") {
            // thin-edge only accepts plain numbers at the series level — no {value, unit} objects
            fragments[key] = { [key]: val };
        }
    }

    const type = fieldName || measurementKeys[0];

    // Re-publish to te/ topic — the c8y mapper built-in adds source.id
    return [{
        topic: `te/device/main///m/${type}`,
        payload: JSON.stringify(Object.assign({ time }, fragments))
    }];
}
