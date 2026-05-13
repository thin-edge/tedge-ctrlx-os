// thin-edge.io flows API (ES2020 module)
// Receives dl/+/+/+/+/a/+ messages from the ctrlX Datalayer bridge
// and re-publishes them as thin-edge alarms on te/device/main///a/+
// The c8y mapper built-in then converts them to Cumulocity alarms.

const decoder = new TextDecoder();

function mapSeverity(ctrlxSeverity) {
    if (!ctrlxSeverity) return "MINOR";
    switch (ctrlxSeverity.toUpperCase()) {
        case "EMERGENCY":
        case "FATAL":
            return "CRITICAL";
        case "ERROR":
            return "MAJOR";
        case "WARNING":
            return "MINOR";
        case "INFORMATIONAL":
        case "INFORMATION":
        case "INFO":
        case "NOTICE":
            return "WARNING";
        default:
            return "MINOR";
    }
}

export function onMessage(message, context) {
    let payload;
    try {
        payload = JSON.parse(decoder.decode(message.payload));
    } catch (e) {
        console.log("[ctrlx-alarms] Failed to parse payload: " + e);
        return [];
    }

    // Extract alarm type from topic: dl/device/main///a/<type>
    const topicParts = message.topic.split("/");
    const alarmType = topicParts[topicParts.length - 1] ?? "ctrlx_alarm";

    // If payload has a nested "Text" field (from bridge MQTT Service format), use it
    const textObj = payload.Text ?? null;
    const ctrlxSeverity = textObj?.severity ?? payload.severity ?? null;
    const severity = mapSeverity(ctrlxSeverity);
    const text = textObj
        ? (typeof textObj === "object" ? JSON.stringify(textObj) : String(textObj))
        : JSON.stringify(payload);
    const time = payload.time ?? textObj?.timestamp ?? new Date().toISOString();
    const status = payload.status ?? "ACTIVE";

    // Publish in thin-edge alarm format — c8y mapper built-in adds source.id
    return [{
        topic: `te/device/main///a/${alarmType}`,
        payload: JSON.stringify({ text, severity, time, status })
    }];
}

