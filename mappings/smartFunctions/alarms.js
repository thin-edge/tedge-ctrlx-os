/**
 * @name Create alarm from ctrlX diagnostic message
 * @description Converts ctrlX diagnostic log entries into Cumulocity alarms.
 * @templateType INBOUND_SMART_FUNCTION
 * @defaultTemplate false
 * @internal true
 * @readonly true
 */

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
            console.log("Unbekannte Severity '" + ctrlxSeverity + "', Fallback: MAJOR");
            return "MAJOR";
    }
}

function onMessage(inputMsg, context) {
    try {
        var payload = inputMsg.getPayload();

        // GraalVM Java-Map: Zugriff über .get()
        var externalId   = payload.get("externalId");
        var time         = payload.get("time");
        var type         = payload.get("type");
        var status       = payload.get("status");
        var textObj      = payload.get("Text");

        console.log("externalId: " + externalId);
        console.log("status: " + status);
        console.log("textObj: " + textObj);

        if (!textObj) {
            console.log("Kein 'Text'-Feld im Payload gefunden.");
            console.log("Response: []");
            return [];
        }

        // Natives JS-Objekt bauen damit JSON.stringify() funktioniert
        var textPlain = {
            mainDiagnosisCode:     textObj.get("mainDiagnosisCode"),
            detailedDiagnosisCode: textObj.get("detailedDiagnosisCode"),
            text:      textObj.get("text"),
            timestamp: textObj.get("timestamp"),
            severity:  textObj.get("severity"),
            origin:    textObj.get("origin"),
            category:  textObj.get("category"),
            state:     textObj.get("state")
        };

        // Severity aus Text-Objekt übersetzen (ctrlX → Cumulocity)
        var ctrlxSeverity  = textObj.get("severity") || payload.get("severity");
        var c8ySeverity    = mapSeverity(ctrlxSeverity);
        console.log("Severity Mapping: " + ctrlxSeverity + " → " + c8ySeverity);

        var textStr = JSON.stringify(textPlain);
        console.log("text: " + textStr);

        var result = [{
            cumulocityType: "alarm",
            action: "create",
            payload: {
                "text":     textStr,
                "time":     time,
                "type":     type,
                "severity": c8ySeverity,
                "status":   status || "ACTIVE"
            },
            externalSource: [{"type": "c8y_Serial", "externalId": externalId}]
        }];

        console.log("Response: " + JSON.stringify(result));
        return result;

    } catch (e) {
        console.log("ERROR in onMessage: " + e.message);
        console.log("Stack: " + e.stack);
        return [];
    }
}