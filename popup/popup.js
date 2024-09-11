/* document.addEventListener("DOMContentLoaded", function () {
    const saveButton = document.getElementById("saveButton");
    const jotformTokenInput = document.getElementById("jotformToken");
    const jotformFormIdInput = document.getElementById("jotformFormId");
    const letterTemplateIdInput = document.getElementById("letterTemplateId");
    const envelopeTemplateIdInput = document.getElementById("envelopeTemplateId");
    const statusMessage = document.getElementById("statusMessage");

    chrome.storage.local.get(["jotformToken", "jotformFormId", "letterTemplateId", "envelopeTemplateId"], function (result) {
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
    });

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
}); */

document.addEventListener("DOMContentLoaded", function () {
    const saveButton = document.getElementById("saveButton");
    const jotformTokenInput = document.getElementById("jotformToken");
    const jotformFormIdInput = document.getElementById("jotformFormId");
    const letterTemplateIdInput = document.getElementById("letterTemplateId");
    const envelopeTemplateIdInput = document.getElementById("envelopeTemplateId");
    const invoiceTemplateIdInput = document.getElementById("invoiceTemplateId");
    const euthanasiaPriceInput = document.getElementById("euthanasiaPrice");
    const smallPrivateCremationPriceInput = document.getElementById("smallPrivateCremationPrice");
    const largePrivateCremationPriceInput = document.getElementById("largePrivateCremationPrice");
    const smallMemorialCremationPriceInput = document.getElementById("smallMemorialCremationPrice");
    const largeMemorialCremationPriceInput = document.getElementById("largeMemorialCremationPrice");
    const furPriceInput = document.getElementById("furPrice");
    const furAndBoxPriceInput = document.getElementById("furAndBoxPrice");
    const clayPawPriceInput = document.getElementById("clayPawPrice");
    const clayNosePriceInput = document.getElementById("clayNosePrice");
    const pawPrintPriceInput = document.getElementById("pawPrintPrice");
    const nosePrintPriceInput = document.getElementById("nosePrintPrice");
    const statusMessage = document.getElementById("statusMessage");

    chrome.storage.local.get(
        [
            "jotformToken",
            "jotformFormId",
            "letterTemplateId",
            "envelopeTemplateId",
            "invoiceTemplateId",
            "euthanasiaPrice",
            "smallPrivateCremationPrice",
            "largePrivateCremationPrice",
            "smallMemorialCremationPrice",
            "largeMemorialCremationPrice",
            "furPrice",
            "furAndBoxPrice",
            "clayPawPrice",
            "clayNosePrice",
            "pawPrintPrice",
            "nosePrintPrice",
        ],
        function (result) {
            const jotformToken = result.jotformToken;
            const jotformFormId = result.jotformFormId;
            const letterTemplateId = result.letterTemplateId;
            const envelopeTemplateId = result.envelopeTemplateId;
            const invoiceTemplateId = result.invoiceTemplateId;
            const euthanasiaPrice = result.euthanasiaPrice;
            const smallPrivateCremationPrice = result.smallPrivateCremationPrice;
            const largePrivateCremationPrice = result.largePrivateCremationPrice;
            const smallMemorialCremationPrice = result.smallMemorialCremationPrice;
            const largeMemorialCremationPrice = result.largeMemorialCremationPrice;
            const furPrice = result.furPrice;
            const furAndBoxPrice = result.furAndBoxPrice;
            const clayPawPrice = result.clayPawPrice;
            const clayNosePrice = result.clayNosePrice;
            const pawPrintPrice = result.pawPrintPrice;
            const nosePrintPrice = result.nosePrintPrice;

            if (jotformToken) jotformTokenInput.value = jotformToken;
            if (jotformFormId) jotformFormIdInput.value = jotformFormId;
            if (letterTemplateId) letterTemplateIdInput.value = letterTemplateId;
            if (envelopeTemplateId) envelopeTemplateIdInput.value = envelopeTemplateId;
            if (invoiceTemplateId) invoiceTemplateIdInput.value = invoiceTemplateId;
            if (euthanasiaPrice) euthanasiaPriceInput.value = euthanasiaPrice;
            if (smallPrivateCremationPrice) smallPrivateCremationPriceInput.value = smallPrivateCremationPrice;
            if (largePrivateCremationPrice) largePrivateCremationPriceInput.value = largePrivateCremationPrice;
            if (smallMemorialCremationPrice) smallMemorialCremationPriceInput.value = smallMemorialCremationPrice;
            if (largeMemorialCremationPrice) largeMemorialCremationPriceInput.value = largeMemorialCremationPrice;
            if (furPrice) furPriceInput.value = furPrice;
            if (furAndBoxPrice) furAndBoxPriceInput.value = furAndBoxPrice;
            if (clayPawPrice) clayPawPriceInput.value = clayPawPrice;
            if (clayNosePrice) clayNosePriceInput.value = clayNosePrice;
            if (pawPrintPrice) pawPrintPriceInput.value = pawPrintPrice;
            if (nosePrintPrice) nosePrintPriceInput.value = nosePrintPrice;
        }
    );

    saveButton.addEventListener("click", function () {
        const jotformToken = jotformTokenInput.value;
        const jotformFormId = jotformFormIdInput.value;
        const letterTemplateId = letterTemplateIdInput.value;
        const envelopeTemplateId = envelopeTemplateIdInput.value;
        const invoiceTemplateId = invoiceTemplateIdInput.value;
        const euthanasiaPrice = euthanasiaPriceInput.value;
        const smallPrivateCremationPrice = smallPrivateCremationPriceInput.value;
        const largePrivateCremationPrice = largePrivateCremationPriceInput.value;
        const smallMemorialCremationPrice = smallMemorialCremationPriceInput.value;
        const largeMemorialCremationPrice = largeMemorialCremationPriceInput.value;
        const furPrice = furPriceInput.value;
        const furAndBoxPrice = furAndBoxPriceInput.value;
        const clayPawPrice = clayPawPriceInput.value;
        const clayNosePrice = clayNosePriceInput.value;
        const pawPrintPrice = pawPrintPriceInput.value;
        const nosePrintPrice = nosePrintPriceInput.value;

        chrome.storage.local.set(
            {
                jotformToken,
                jotformFormId,
                letterTemplateId,
                envelopeTemplateId,
                invoiceTemplateId,
                euthanasiaPrice,
                smallPrivateCremationPrice,
                largePrivateCremationPrice,
                smallMemorialCremationPrice,
                largeMemorialCremationPrice,
                furPrice,
                furAndBoxPrice,
                clayPawPrice,
                clayNosePrice,
                pawPrintPrice,
                nosePrintPrice,
            },
            function () {
                statusMessage.textContent = "Data saved successfully!";
            }
        );
    });
});
