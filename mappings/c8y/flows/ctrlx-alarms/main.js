// thin-edge.io flows API (ES2020 module)
// Receives te/+/+/+/+/a/+ messages and forwards them as
// Cumulocity alarms to c8y/alarm/alarms/create

const decoder = new TextDecoder();

function mapSeverity(ctrlxSeverity) {
    if (!ctrlxSeverity) return "MAJOR";
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
            console.log("[ctrlx-alarms] Unknown severity '" + ctrlxSeverity + "', fallback: MAJOR");
            return "MAJOR";
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

    // Derive device context key from topic
    // e.g. "te/device/main///a/ctrlx_alarm" → "device/main//"
    const topicParts = message.topic.split("/");
    const deviceKey = topicParts.slice(1, 5).join("/");
    const alarmTypeFromTopic = topicParts[6] ?? "ctrlx_alarm";

    // Resolve Cumulocity device ID from mapper context
    const deviceInfo = context.mapper.get(deviceKey) ?? {};
    const deviceId = deviceInfo["@id"];
    if (!deviceId) {
        console.log("[ctrlx-alarms] No device ID found for: " + deviceKey);
        return [];
    }

    // If payload has a nested "Text" field (from bridge service MQTT Service format),
    // extract severity and text from it; otherwise use top-level fields
    const textObj = payload.Text ?? null;
    const ctrlxSeverity = (textObj?.severity) ?? payload.severity ?? null;
    const c8ySeverity = mapSeverity(ctrlxSeverity);

    const text = textObj
        ? (typeof textObj === "object" ? JSON.stringify(textObj) : String(textObj))
        : JSON.stringify(payload);

    const time = payload.time ?? payload.Time ?? textObj?.timestamp ?? new Date().toISOString();
    const type = payload.type ?? alarmTypeFromTopic;
    const status = payload.status ?? "ACTIVE";

    return [{
        topic: "c8y/alarm/alarms/create",
        payload: JSON.stringify({
            text,
            time,
            type,
            severity: c8ySeverity,
            status,
            source: { id: deviceId }
        })
    }];
}

