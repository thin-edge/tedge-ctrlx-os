const decoder = new TextDecoder();

export function onMessage(message, context) {
    const payload = JSON.parse(decoder.decode(message.payload));
    const temperature = payload?.temperature;

    if (typeof temperature !== "number") {
        return [];
    }

    // Derive the alarm topic from the incoming message's device prefix
    // e.g. "te/device/main///m/environment" → "te/device/main///a/temp_high"
    const alarmTopic = message.topic.split("/").slice(0, 5).join("/") + "/a/temp_high";

    if (temperature >= 70.0) {
        return [{
            topic: alarmTopic,
            payload: JSON.stringify({
                severity: "major",
                text: `Temperature is ${temperature}°C, exceeding the 70°C limit`,
            }),
            mqtt: { retain: true, qos: 1 },
        }];
    }

    // Clear the alarm by publishing an empty retained message
    return [{
        topic: alarmTopic,
        payload: "",
        mqtt: { retain: true, qos: 1 },
    }];
}