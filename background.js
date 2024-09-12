chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page is fully loaded
    chrome.storage.local.get(["jotformFormId"], function (result) {
        const jotformFormId = result.jotformFormId;
        console.log("%cRetrieved JotForm form ID: ", "color: green;", jotformFormId);

        // Jotform
        if (changeInfo.status === "complete" && tab.url && tab.url.includes(`jotform.com/inbox/${jotformFormId}`)) {
            chrome.tabs.sendMessage(tabId, {
                action: "createFormButton",
                type: "NEW",
            });
        }
        // Crematory
        else if (changeInfo.status === "complete" && tab.url && tab.url.includes(`pawsetrack.vet/app/dashboard`)) {
            chrome.tabs.sendMessage(tabId, {
                action: "startNewOrder",
                type: "NEW",
            });
        } else if (changeInfo.status === "complete" && tab.url && tab.url.includes(`pawsetrack.vet/app/orders/start`)) {
            chrome.tabs.sendMessage(tabId, {
                action: "selectCremationType",
                type: "NEW",
            });
        } else if (changeInfo.status === "complete" && tab.url && tab.url.includes(`pawsetrack.vet/app/orders/add`)) {
            if (tab.url.includes(`(details:petandowner)`)) {
                chrome.tabs.sendMessage(tabId, {
                    action: "fillPetAndOwnerForm",
                    type: "NEW",
                });
            } else if (tab.url.includes(`(details:bundles)`)) {
                chrome.tabs.sendMessage(tabId, {
                    action: "fillBundlesForm",
                    type: "NEW",
                });
            } else if (tab.url.includes(`(details:urn)`)) {
                chrome.tabs.sendMessage(tabId, {
                    action: "selectUrn",
                    type: "NEW",
                });
            } else if (tab.url.includes(`(details:memorial)`)) {
                chrome.tabs.sendMessage(tabId, {
                    action: "fillMemorialForm",
                    type: "NEW",
                });
            } else if (tab.url.includes(`(details:review)`)) {
                chrome.tabs.sendMessage(tabId, {
                    action: "fillReviewForm",
                    type: "NEW",
                });
            }
        }
        // Google Calendar
        else if (changeInfo.status === "complete" && tab.url && tab.url.includes("eventedit")) {
            chrome.tabs.sendMessage(tabId, {
                action: "createJotformLinkButton",
                type: "NEW",
            });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fillDocsAndEmail") {
        const submissionId = message.submissionId;

        chrome.storage.local.get(["jotformToken"], function (result) {
            const jotformToken = result.jotformToken;
            console.log("%cRetrieved JotForm token: ", "color: green", jotformToken);

            fetch(`https://api.jotform.com/submission/${submissionId}?apiKey=${jotformToken}`)
                .then((response) => response.json())
                .then(handleData)
                .then(storeJotformData)
                .then(createAndSendGmailDraft)
                .then(createInvoice)
                .then(createLetter)
                .then(createEnvelope)
                .then((data) => {
                    console.log("All tasks completed successfully with data:", data);
                    sendResponse({ success: true, data: data });
                })
                .catch((error) => {
                    console.error("Error during data processing:", error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true; // Keep the messaging channel open for async response
    } else if (message.action === "fillCrematoryForms") {
        const submissionId = message.submissionId;

        chrome.storage.local.get(["jotformToken"], function (result) {
            const jotformToken = result.jotformToken;
            console.log("%cRetrieved JotForm token: ", "color: green", jotformToken);

            fetch(`https://api.jotform.com/submission/${submissionId}?apiKey=${jotformToken}`)
                .then((response) => response.json())
                .then(handleData)
                .then(storeJotformData)
                // .then(createAndSendGmailDraft)
                // .then(createInvoice)
                // .then(createLetter)
                // .then(createEnvelope)
                .then((data) => {
                    console.log("All tasks completed successfully with data:", data);
                    sendResponse({ success: true, data: data });
                })
                .catch((error) => {
                    console.error("Error during data processing:", error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true; // Keep the messaging channel open for async response
    } else if (message.action === "openAndPrintDoc") {
        const docUrl = `https://docs.google.com/document/d/${message.docId}/edit`;
        chrome.tabs.create({ url: docUrl }, function (tab) {
            chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, info) {
                if (tabId === tab.id && info.status === "complete") {
                    chrome.tabs.sendMessage(tabId, {
                        action: "printDoc",
                        docId: message.docId,
                    });
                    chrome.tabs.onUpdated.removeListener(onTabUpdated);
                }
            });
        });
    } else if (message.action === "deleteDoc") {
        deleteDocument(message.docId);
    } /* else if (message.action === "openAndFillCrematoryForm") {
        const url = `https://pawsetrack/app/dashboard`;
        chrome.tabs.create({ url }, function (tab) {
            chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, info) {
                if (tabId === tab.id && info.status === "complete") {
                    chrome.tabs.sendMessage(tabId, {
                        action: "fillCrematoryForm",
                    });
                    chrome.tabs.onUpdated.removeListener(onTabUpdated);
                }
            });
        });
    } */
});

function createAndSendGmailDraft(data) {
    console.log("Creating and sending Gmail draft with data:", data);
    const formattedDate = new Date(data.dateOf6["datetime"]).toLocaleString();

    const emailBody = `
    <p style="margin: 0";>Patient: ${data.nameOf}</p>
    <p style="margin: 0";>Date of Scheduled Appointment: ${formattedDate}</p>
    <p style="margin: 0";>Client Name: ${data.clientName["first"]} ${data.clientName["last"]}</p>
    <p style="margin: 0";>Address: ${data.address["addr_line1"]}</p>
    <p style="margin: 0";>         ${data.cityStatePostal}</p>
    <p style="margin: 0";>Phone Number: ${data.phoneNumber["full"]}</p>

    <p style="margin: 32px 0";><strong>Pet’s ashes and/or memorial products will be delivered to your hospital by West Coast Pet Memorial. Please call the owner when they are ready to be picked-up.</strong></p>

    <p style="margin: 16px 0";>Dear Doctors and Staff,</p>

    <p style="margin: 16px 0";>I regret to inform you of the passing of our mutual patient, ${data.nameOf}, who was humanely euthanized in the comfort of home due to declining quality of life. My condolences for the loss of your patient.<p>

    <p style="margin: 16px 0";>I sincerely appreciate your referral and time. Please do not hesitate to contact me with any questions.</p>
`;
    let draftId;
    sendGmailDraft("EnterHospitalEmail@gmail.com", `Notification of Euthanasia`, emailBody, function (error, response) {
        if (error) {
            console.error("Failed to create Gmail draft:", error.message);
            return;
        }
        console.log("%cGmail draft created successfully:", "color: green", response);
        draftId = response.id;
    });

    return data;
}

//HTML email
function sendGmailDraft(to, subject, body, callback) {
    authenticateGoogle(function (token) {
        if (!token) {
            console.error("Authentication failed: No token received.");
            return callback(new Error("Authentication failed."));
        }

        const url = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

        // Construct the raw email content with HTML
        const email = [`Content-Type: text/html; charset=UTF-8`, `To: ${to}`, `Subject: ${subject}`, "", body].join("\r\n"); // Use CRLF (\r\n) as per RFC 5322

        // Encode the email in base64url format
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const data = {
            message: {
                raw: base64EncodedEmail,
            },
        };

        makeApiCall(url, "POST", data, token, function (error, response) {
            if (error) {
                console.error("Error creating Gmail draft:", error);
                return callback(error);
            }
            console.log("%cDraft created:", "color: green", response);
            callback(null, response);
        });
    });
}

async function handleData(data) {
    console.log("Step 1: Handle Data");
    let submissionData = extractFormData(data.content.answers);
    submissionData = await gatherAdditionalInformation(submissionData); // Await this as it's asynchronous
    submissionData.submissionDate = data.content.created_at;
    console.log("%cSubmission Data Retrieved Successfully:", "color: green", submissionData);
    return submissionData;
}

function extractFormData(data) {
    const formData = {};

    Object.values(data).forEach((field) => {
        if (field.name && field.answer) {
            if (typeof field.answer === "string") {
                formData[field.name] = field.answer.trim();
            } else if (typeof field.answer === "object" && field.answer !== null) {
                Object.entries(field.answer).forEach(([key, value]) => {
                    field.answer[key] = value.trim();
                });
                formData[field.name] = field.answer;
            } else {
                formData[field.name] = field.answer;
            }
        }
    });

    return formData;
}

async function gatherAdditionalInformation(data) {
    console.log("Step 2: Gather Additional Information");

    const { species, sex, address } = data;
    let cuteSpecies, pronoun1, pronoun2;

    if (species === "Dog") {
        cuteSpecies = "pup";
    } else if (species === "Cat") {
        cuteSpecies = "kitty";
    }

    if (sex === "Male") {
        pronoun1 = "him";
        pronoun2 = "he";
    } else if (sex === "Female") {
        pronoun1 = "her";
        pronoun2 = "she";
    }

    data.cuteSpecies = cuteSpecies;
    data.pronoun1 = pronoun1;
    data.pronoun2 = pronoun2;

    console.log(data.address);
    data.cityStatePostal = `${address["city"]}, ${address["state"]} ${address["postal"]}`;

    data.cremationType = data.cremationType.includes("PRIVATE cremation")
        ? "Private"
        : data.cremationType.includes("MEMORIAL cremation")
        ? "Memorial"
        : "Retain";

    data.collectionLocation = !data.collectionLocation
        ? ""
        : data.collectionLocation.includes("office")
        ? "Office"
        : data.collectionLocation.includes("pick-up")
        ? "Pick-up"
        : data.collectionLocation.includes("mailed")
        ? "Mailed"
        : "Sarena";

    data.pawOrNosePrint = data.privatePawOrNosePrint ? data.privatePawOrNosePrint : data.memorialPawOrNosePrint;

    const storageKeys = [
        "invoiceTemplateId",
        "letterTemplateId",
        "envelopeTemplateId",
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
        // "cremationType",
    ];

    return new Promise((resolve, reject) => {
        chrome.storage.local.get(storageKeys, function (items) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                Object.assign(data, items);
                console.log("Additional information gathered:", data);
                resolve(data); // Resolve the promise once data is gathered
            }
        });
    });
}

async function storeJotformData(data) {
    console.log("Step 3: Store Jotform Data", data);

    let isUrnEngraved = false;
    let urnLine1 = "",
        urnLine2 = "",
        urnLine3 = "",
        urnLine4 = "";

    if (data.engravingLine1 || data.engravingLine2 || data.engravingLine3 || data.engravingLine4) {
        isUrnEngraved = true;
        urnLine1 = data.engravingLine1;
        urnLine2 = data.engravingLine2;
        urnLine3 = data.engravingLine3;
        urnLine4 = data.engravingLine4;
    } else if (data.metalEngravingLine1 || data.metalEngravingLine2) {
        urnLine1 = data.metalEngravingLine1;
        urnLine2 = data.metalEngravingLine2;
    } else if (data.namePlateLine1 || data.namePlateLine2) {
        urnLine1 = data.namePlateLine1;
        urnLine2 = data.namePlateLine2;
    }

    if (!data.clayNosePrint) data.clayNosePrint = 0;
    if (!data.clayPawPrint) data.clayPawPrint = 0;
    if (!data.additionalBoxedFurClipping) data.additionalBoxedFurClipping = 0;
    if (!data.additionalFurClipping) data.additionalFurClipping = 0;
    if (!data.additionalNosePrint) data.additionalNosePrint = 0;
    if (!data.additonalPawPrint) data.additonalPawPrint = 0;

    return new Promise((resolve, reject) => {
        chrome.storage.local.set(
            {
                cremationType: data.cremationType,
                petName: data.nameOf,
                species: data.species,
                breed: data.breed,
                weight: data.approximateWeight,
                passingDate: data.dateOf6["datetime"],
                sex: data.sex,
                age: data.age,
                clientFirstName: data.clientName["first"],
                clientLastName: data.clientName["last"],
                clientEmail: data.email,
                clientPhone: data.phoneNumber["full"],
                clientAddress1: data.address["addr_line1"],
                clientAddress2: `${data.address["city"]}, ${data.address["state"]} ${data.address["postal"]}`,
                urnChoice: data.urnChoices,
                urnLine1: urnLine1,
                urnLine2: urnLine2,
                urnLine3: urnLine3,
                urnLine4: urnLine4,
                isUrnEngraved: isUrnEngraved,
                pawOrNosePrint: data.pawOrNosePrint,
                clayNosePrint: data.clayNosePrint,
                clayPawPrint: data.clayPawPrint,
                additionalBoxedFurClipping: data.additionalBoxedFurClipping,
                additionalFurClipping: data.additionalFurClipping,
                additionalNosePrint: data.additionalNosePrint,
                additonalPawPrint: data.additonalPawPrint,
                collectionLocation: data.collectionLocation,
                petHospital: data.petHospital,
            },
            function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    console.log("Data saved successfully!");
                    resolve(data); // Resolve once the storage operation is complete
                }
            }
        );
    });
}

function createInvoice(data) {
    const myData = data;
    return new Promise((resolve, reject) => {
        console.log("Step 3: Create Invoice");
        console.log("creating invoice", myData);
        console.log("Nose Print Price:", myData.nosePrintPrice);
        console.log(Object.keys(myData));
        console.log(data.invoiceTemplateId);
        if (myData.invoiceTemplateId) {
            console.log("Invoice Template ID:", myData.invoiceTemplateId);
        } else {
            console.log("Invoice Template ID is missing or empty");
        }

        const currentDate = new Date().toLocaleDateString("en-US");

        // if did not request an itemized invoice then do not go through with the rest of the code
        if (data.itemizedReceipt !== "Yes") {
            console.log("No itemized Receipt");
            return resolve(data);
        }

        let products = [];
        // Euthanasia
        products.push({
            name: "Euthanasia",
            subtotal: data.euthanasiaPrice,
        });
        // Cremation
        if (data.cremationType === "Private" && data.approximateWeight < 80) {
            products.push({
                name: "Private Cremation (< 80lbs)",
                subtotal: parseFloat(data.smallPrivateCremationPrice),
            });
        } else if (data.cremationType === "Private" && data.approximateWeight >= 80) {
            products.push({
                name: "Private Cremation (>= 80lbs)",
                subtotal: parseFloat(data.largePrivateCremationPrice),
            });
        } else if (data.cremationType === "Memorial" && data.approximateWeight < 80) {
            products.push({
                name: "Memorial Cremation (< 80lbs)",
                subtotal: parseFloat(data.smallPrivateCremationPrice),
            });
        } else if (data.cremationType === "Memorial" && data.approximateWeight >= 80) {
            products.push({
                name: "Memorial Cremation (>= 80lbs)",
                subtotal: parseFloat(data.largePrivateCremationPrice),
            });
        }

        // Special Products
        if (data.clayNosePrint) {
            products.push({
                name: `Clay Nose Print x${data.clayNosePrint}`,
                quantity: data.clayNosePrint,
                subtotal: data.clayNosePrint * parseFloat(data.clayNosePrice),
            });
        }
        if (data.clayPawPrint) {
            products.push({
                name: `Clay Paw Print x${data.clayPawPrint}`,
                quantity: data.clayPawPrint,
                subtotal: data.clayPawPrint * parseFloat(data.clayPawPrice),
            });
        }
        if (data.additionalBoxedFurClipping) {
            products.push({
                name: `Additional Boxed Fur Clipping x${data.additionalBoxedFurClipping}`,
                quantity: data.additionalBoxedFurClipping,
                subtotal: data.additionalBoxedFurClipping * parseFloat(data.furAndBoxPrice),
            });
        }
        if (data.additionalFurClipping) {
            products.push({
                name: `Additional Fur Clipping x${data.additionalFurClipping}`,
                quantity: data.additionalFurClipping,
                subtotal: data.additionalFurClipping * parseFloat(data.furPrice),
            });
        }
        if (data.additionalNosePrint) {
            products.push({
                name: `Additional Nose Print x${data.additionalNosePrint}`,
                quantity: data.additionalNosePrint,
                subtotal: data.additionalNosePrint * parseFloat(data.nosePrintPrice),
            });
        }
        if (data.additonalPawPrint) {
            products.push({
                name: `Additional Paw Print x${data.additonalPawPrint}`,
                quantity: data.additonalPawPrint,
                subtotal: data.additonalPawPrint * parseFloat(data.pawPrintPrice),
            });
        }

        console.log("Made it 1");

        const subtotal = products.reduce((total, product) => total + (parseFloat(product.subtotal) || 0), 0);
        const paid = 0;
        const total = subtotal - paid;

        //format subtotals as currency
        products.forEach((product) => {
            product.subtotal = formatAsCurrency(product.subtotal);
        });

        // if products array is not filled with all 8 products then we need to fill with empty spaces
        while (products.length < 8) {
            products.push({ name: "", subtotal: "" });
        }

        console.log("invoiceTemplateId:", data.invoiceTemplateId);

        createDocFromTemplate(
            data.invoiceTemplateId,
            `(Invoice) ${data.nameOf}\'s Passing ${data.submissionDate}`,
            {
                Date: currentDate,
                ClientName: `${data.clientName["first"]} ${data.clientName["last"]}`,
                Address: `${data.address["addr_line1"]}
                    ${data.cityStatePostal}`,
                PhoneNumber: data.phoneNumber["full"],
                PetName: data.nameOf,
                Breed: data.breed,
                Age: data.age,
                Weight: data.approximateWeight,
                Sex: data.sex,
                Species: data.species,

                Product1: products[0].name,
                Amount1: products[0].subtotal,
                Product2: products[1].name,
                Amount2: products[1].subtotal,
                Product3: products[2].name,
                Amount3: products[2].subtotal,
                Product4: products[3].name,
                Amount4: products[3].subtotal,
                Product5: products[4].name,
                Amount5: products[4].subtotal,
                Product6: products[5].name,
                Amount6: products[5].subtotal,
                Product7: products[6].name,
                Amount7: products[6].subtotal,
                Product8: products[7].name,
                Amount8: products[7].subtotal,

                SubtotalAmt: formatAsCurrency(subtotal),
                PaidAmt: formatAsCurrency(paid),
                DueAmt: formatAsCurrency(total),
            },
            function (newDocId) {
                console.log("%cNew document created with ID:", "color: green", newDocId);
                data.invoiceDocId = newDocId;
                resolve(data);
            }
        );
    });
}

function formatAsCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function createDocFromTemplate(templateDocId, title, replacements, callback) {
    copyTemplate(templateDocId, title, function (newDocId) {
        replaceTextInDocument(newDocId, replacements, function (response) {
            callback(newDocId); // Return the new document's ID
        });
    });
}

function copyTemplate(templateDocId, title, callback) {
    authenticateGoogle(function (token) {
        const url = `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`;
        const data = { name: title };

        makeApiCall(url, "POST", data, token, function (error, response) {
            if (error) {
                console.error("Error copying template:", error);
                return;
            }
            console.log("%cDocument copied successfully:", "color: green", response);
            callback(response.id); // Get the new document's ID
        });
    });
}

function authenticateGoogle(callback) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
            console.error("Authentication error:", chrome.runtime.lastError);
            return callback(new Error("Authentication failed."));
        }
        callback(token);
    });
}

function makeApiCall(url, method, data, token, callback) {
    console.log("Making API call on data:", data);
    fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : null,
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errData) => {
                    throw new Error(`API call failed with status ${response.status}: ${errData.error.message}`);
                });
            }
            return response.json();
        })
        .then((data) => callback(null, data))
        .catch((error) => {
            console.error("API call error:", error);
            callback(error);
        });
}

function replaceTextInDocument(docId, replacements, callback) {
    authenticateGoogle(function (token) {
        const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;

        console.log(replacements);

        const requests = Object.keys(replacements).map((key) => ({
            replaceAllText: {
                containsText: {
                    text: `{{${key}}}`,
                    matchCase: true,
                },
                replaceText: replacements[key],
            },
        }));

        const data = { requests: requests };

        makeApiCall(url, "POST", data, token, function (error, response) {
            if (error) {
                console.error("Error replacing text:", error);
                return;
            }
            console.log("%cText replaced:", "color: green", response);
            callback(response);
        });
    });
}

function createLetter(data) {
    console.log("Creating letter document with data:", data);
    return new Promise((resolve, reject) => {
        createDocFromTemplate(
            data.letterTemplateId,
            `(Letter) ${data.nameOf}'s Passing ${data.submissionDate}`,
            {
                familyName: data.clientName["last"],
                NameOfPet: data.nameOf,
                species: data.cuteSpecies,
                pronoun1: data.pronoun1,
                pronoun2: data.pronoun2,
            },
            function (newDocId) {
                console.log("%cNew letter document created with ID:", "color: green", newDocId);
                data.letterDocId = newDocId;
                resolve(data);
            }
        );
    });
}

function createEnvelope(data) {
    console.log("Creating envelope document with data:", data);
    return new Promise((resolve, reject) => {
        createDocFromTemplate(
            data.envelopeTemplateId,
            `(Envelope) ${data.nameOf}'s Passing ${data.submissionDate}`,
            {
                familyName: data.clientName["last"],
                AddressLine1: data.address["addr_line1"],
                AddressLine2: data.cityStatePostal,
                AddressLine3: "",
            },
            function (newDocId) {
                console.log("%cNew envelope document created with ID:", "color: green", newDocId);
                data.envelopeDocId = newDocId;
                resolve(data);
            }
        );
    });
}
