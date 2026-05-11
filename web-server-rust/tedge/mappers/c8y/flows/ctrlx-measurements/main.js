/**
 * @name Default template for Smart Function
 * @description Default template for Smart Function, creates one measurement
 * @templateType INBOUND_SMART_FUNCTION
 * @direction INBOUND
 * @defaultTemplate true
 * @internal true
 * @readonly true
 * 
*/

function onMessage(msg, context) {
    var payload = msg.getPayload();

    console.log("Payload Raw:" + payload);

    // Get externalId from context first, fall back to payload
    var externalId = context.getClientId() || payload.get("externalId");

    // lookup device for enrichment
    var deviceByExternalId = context.getManagedObject(
        JSON.stringify({ externalId: externalId, type: "c8y_Serial" })
    );
    console.log("Device (by external id): " + deviceByExternalId);

    // Build measurement fragments dynamically from payload keys
    var skipKeys = ["externalId", "unit", "time", "_TOPIC_LEVEL_", "_CONTEXT_DATA_"];
    var unit = payload.get("unit") ? String(payload.get("unit")) : "";
    var fragments = {};
    var keys = payload.keySet().toArray();
    for (var i = 0; i < keys.length; i++) {
        var key = String(keys[i]);
        if (skipKeys.indexOf(key) === -1) {
            fragments[key] = {
                [key]: {
                    "unit": unit,
                    "value": payload.get(key)
                }
            };
        }
    }

    return [{
        cumulocityType: "measurement",
        action: "create",

        payload: Object.assign({
            "time": payload.get("time") ? String(payload.get("time")) : new Date().toISOString(),
            "type": keys.filter(function(k) { return skipKeys.indexOf(String(k)) === -1; }).map(String)[0] || "measurement"
        }, fragments),

        externalSource: [{"type": "c8y_Serial", "externalId": externalId}]
    }];
}
