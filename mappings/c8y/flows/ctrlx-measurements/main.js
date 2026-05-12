// thin-edge.io flows API (ES2020 module)
// Receives te/+/+/+/+/m/+ messages and forwards them as
// Cumulocity measurements to c8y/measurement/measurements/create

const decoder = new TextDecoder();

const SKIP_KEYS = ["externalId", "unit", "time", "_TOPIC_LEVEL_", "_CONTEXT_DATA_"];

export function onMessage(message, context) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(message.payload));
    } catch (e) {
        console.log("[ctrlx-measurements] Failed to parse payload: " + e);
        return [];
    }

    // Derive device context key from topic.
    // Expected: "te/device/main///m/temperature" → key "device/main//"
    // For non-te topics fall back to the main device.
    const topicParts = message.topic.split("/");
    const deviceKey = message.topic.startsWith("te/")
        ? topicParts.slice(1, 5).join("/")
        : "device/main//";

    // Resolve Cumulocity device ID from mapper context (set during device registration)
    const deviceInfo = context.mapper.get(deviceKey) ?? {};
    const deviceId = deviceInfo["@id"];
    if (!deviceId) {
        console.log("[ctrlx-measurements] No device ID found for: " + deviceKey);
        return [];
    }

    const unit = payload.unit != null ? String(payload.unit) : "";
    const time = payload.time != null ? String(payload.time) : new Date().toISOString();

    // Build measurement fragments from all payload keys except reserved ones
    const measurementKeys = Object.keys(payload).filter(k => SKIP_KEYS.indexOf(k) === -1);
    const fragments = {};
    for (const key of measurementKeys) {
        fragments[key] = {
            [key]: { value: payload[key], unit }
        };
    }

    const type = measurementKeys[0] ?? "measurement";

    return [{
        topic: "c8y/measurement/measurements/create",
        payload: JSON.stringify(Object.assign({ time, type, source: { id: deviceId } }, fragments))
    }];
}
