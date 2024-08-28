document.addEventListener("DOMContentLoaded", function () {
    const saveButton = document.getElementById("saveButton");
    const jotformTokenInput = document.getElementById("jotformToken");
    const jotformFormIdInput = document.getElementById("jotformFormId");
    const letterTemplateIdInput = document.getElementById("letterTemplateId");
    const envelopeTemplateIdInput =
        document.getElementById("envelopeTemplateId");
    const statusMessage = document.getElementById("statusMessage");

    chrome.storage.local.get(
        [
            "jotformToken",
            "jotformFormId",
            "letterTemplateId",
            "envelopeTemplateId",
        ],
        function (result) {
            const jotformToken = result.jotformToken;
            const jotformFormId = result.jotformFormId;
            const letterTemplateId = result.letterTemplateId;
            const envelopeTemplateId = result.envelopeTemplateId;

            if (jotformToken) {
                jotformTokenInput.value = jotformToken;
            }
            if (jotformFormId) {
                jotformFormIdInput.value = jotformFormId;
            }
            if (letterTemplateId) {
                letterTemplateIdInput.value = letterTemplateId;
            }
            if (envelopeTemplateId) {
                envelopeTemplateIdInput.value = envelopeTemplateId;
            }
        }
    );

    saveButton.addEventListener("click", function () {
        const jotformToken = jotformTokenInput.value;
        const jotformFormId = jotformFormIdInput.value;
        const letterTemplateId = letterTemplateIdInput.value;
        const envelopeTemplateId = envelopeTemplateIdInput.value;

        // Store data in chrome.storage.local
        chrome.storage.local.set(
            {
                jotformToken: jotformToken,
                jotformFormId: jotformFormId,
                letterTemplateId: letterTemplateId,
                envelopeTemplateId: envelopeTemplateId,
            },
            function () {
                // Notify that we saved the data
                statusMessage.textContent = "Data saved successfully!";
            }
        );
    });
});
