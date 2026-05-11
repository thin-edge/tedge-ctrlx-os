/**
 * @name Create event from ctrlX diagnostic message
 * @description Converts ctrlX diagnostic log entries into Cumulocity events.
 * @templateType INBOUND_SMART_FUNCTION
 * @defaultTemplate false
 * @internal true
 * @readonly true
 */

function onMessage(inputMsg, context) {
    try {
        var payload = inputMsg.getPayload();

        // GraalVM Java-Map: Zugriff über .get(), nicht ["key"]
        var externalId = payload.get("externalId");
        var time       = payload.get("time");
        var type       = payload.get("type");
        var textObj    = payload.get("Text");

        console.log("externalId: " + externalId);
        console.log("time: " + time);
        console.log("type: " + type);
        console.log("textObj: " + textObj);

        if (!textObj) {
            console.log("Kein 'Text'-Feld im Payload gefunden.");
            console.log("Response: []");
            return [];
        }

        // Manuell ein natives JS-Objekt bauen, damit JSON.stringify() funktioniert
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

        var textStr = JSON.stringify(textPlain);
        console.log("text: " + textStr);

        var result = [{
            cumulocityType: "event",
            action: "create",
            payload: {
                "text": textStr,
                "time": time,
                "type": type
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