// thin-edge.io flows API (ES2020 module)
// Receives dl/+/+/+/+/m/+ messages from the ctrlX Datalayer bridge
// and publishes them directly to c8y/measurement/measurements/create
// with the full Cumulocity measurement format including value and unit.

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
    const unit = payload.unit != null ? String(payload.unit) : "";
    const time = payload.time != null ? String(payload.time) : new Date().toISOString();

    // Build Cumulocity measurement: { "<fragment>": { "<series>": { value, unit } } }
    const measurementKeys = Object.keys(payload).filter(k => SKIP_KEYS.indexOf(k) === -1);
    if (measurementKeys.length === 0) return [];

    const fragments = {};
    for (const key of measurementKeys) {
        const val = payload[key];
        if (typeof val === "number") {
            const series = unit ? { value: val, unit } : { value: val };
            fragments[key] = { [key]: series };
        }
    }

    const type = fieldName || measurementKeys[0];

    // Publish directly to c8y — thin-edge cloud connector forwards to Cumulocity
    return [{
        topic: `c8y/measurement/measurements/create`,
        payload: JSON.stringify(Object.assign({ time, type }, fragments))
    }];
}
