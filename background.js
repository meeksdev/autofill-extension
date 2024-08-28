chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page is fully loaded
    chrome.storage.local.get(["jotformFormId"], function (result) {
        const jotformFormId = result.jotformFormId;
        console.log(
            "%cRetrieved JotForm form ID: ",
            "color: green;",
            jotformFormId
        );
        if (
            changeInfo.status === "complete" &&
            tab.url &&
            tab.url.includes(`jotform.com/inbox/${jotformFormId}`)
        ) {
            chrome.tabs.sendMessage(tabId, {
                action: "createFormButton",
                type: "NEW",
            });
        } else if (
            changeInfo.status === "complete" &&
            tab.url &&
            tab.url.includes(`pawsetrack.vet/app/orders/add`)
        ) {
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
            }
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getJotFormSubmissionData") {
        const submissionId = message.submissionId;

        chrome.storage.local.get(["jotformToken"], function (result) {
            const jotformToken = result.jotformToken;
            console.log(
                "%cRetrieved JotForm token: ",
                "color: green",
                jotformToken
            );

            fetch(
                `https://api.jotform.com/submission/${submissionId}?apiKey=${jotformToken}`
            )
                .then((response) => response.json())
                .then((data) => {
                    let submissionData = extractFormData(data.content.answers);
                    submissionData =
                        gatherAdditionalPetInformation(submissionData);
                    submissionData.submissionDate = data.content.created_at;
                    console.log(
                        "%cSubmission Data Retrieved Succesfully:",
                        "color: green",
                        submissionData
                    );
                    const formattedDate = new Date(
                        submissionData.dateOf6["datetime"]
                    ).toLocaleString();

                    storeJotformData(submissionData);

                    const emailBody = `
                        <p style="margin: 0";>Patient: ${
                            submissionData.nameOf
                        }</p>
                        <p style="margin: 0";>Date of Scheduled Appointment: ${formattedDate}</p>
                        <p style="margin: 0";>Client Name: ${
                            submissionData.clientName["first"]
                        } ${submissionData.clientName["last"]}</p>
                        <p style="margin: 0";>Address: ${
                            submissionData.address["addr_line1"]
                        }</p>
                        <p style="margin: 0";>         ${submissionData.address[
                            "city"
                        ].trim()}, ${submissionData.address["state"]}, ${
                        submissionData.address["postal"]
                    }</p>
                        <p style="margin: 0";>Phone Number: ${
                            submissionData.phoneNumber["full"]
                        }</p>

                        <p style="margin: 32px 0";><strong>Pet’s ashes and/or memorial products will be delivered to your hospital by West Coast Pet Memorial. Please call the owner when they are ready to be picked-up.</strong></p>

                        <p style="margin: 16px 0";>Dear Doctors and Staff,</p>

                        <p style="margin: 16px 0";>I regret to inform you of the passing of our mutual patient, ${
                            submissionData.nameOf
                        }, who was humanely euthanized in the comfort of home due to declining quality of life. My condolences for the loss of your patient.<p>

                        <p style="margin: 16px 0";>I sincerely appreciate your referral and time. Please do not hesitate to contact me with any questions.</p>
                    `;
                    let draftId;
                    sendGmailDraft(
                        "EnterHospitalEmail@gmail.com",
                        `${submissionData.nameOf}'s Passing`,
                        emailBody,
                        function (error, response) {
                            if (error) {
                                console.error(
                                    "Failed to create Gmail draft:",
                                    error.message
                                );
                                // Handle the error (e.g., show an error message to the user)
                                return;
                            }
                            console.log(
                                "%cGmail draft created successfully:",
                                "color: green",
                                response
                            );
                            draftId = response.id;
                        }
                    );

                    let copiedDocId;
                    createDocFromTemplate(
                        "1dQthwmn36E_eIrBKiXn-47rxqtfjTr8AGzyXjXYFNp4",
                        `${submissionData.nameOf}\'s Passing ${submissionData.submissionDate}`,
                        {
                            NameOfPet: submissionData.nameOf,
                            species: submissionData.cuteSpecies,
                            pronoun1: submissionData.pronoun1,
                            pronoun2: submissionData.pronoun2,
                        },
                        function (newDocId) {
                            copiedDocId = newDocId;
                            console.log(
                                "%cNew document created with ID:",
                                "color: green",
                                newDocId
                            );

                            sendResponse({
                                success: true,
                                data: data,
                                docId: copiedDocId,
                                draftId: draftId,
                            });
                        }
                    );
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error });
                });
        });

        return true; // Keep the messaging channel open for async response
    } else if (message.action === "openAndPrintDoc") {
        const docUrl = `https://docs.google.com/document/d/${message.docId}/edit`;
        chrome.tabs.create({ url: docUrl }, function (tab) {
            chrome.tabs.onUpdated.addListener(function onTabUpdated(
                tabId,
                info
            ) {
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
    }
});

function extractFormData(submissionData) {
    const formData = {};

    Object.values(submissionData).forEach((field) => {
        if (field.name && field.answer) {
            formData[field.name] = field.answer;
        }
    });

    return formData;
}

function storeJotformData(submissionData) {
    // should probably make address line 2 with city state and postal code.
    chrome.storage.local.set(
        {
            // Pet and Owner Data
            petName: submissionData.nameOf,
            species: submissionData.species,
            breed: submissionData.breed,
            weight: submissionData.approximateWeight,
            //   birthDate,
            passingDate: submissionData.dateOf6["datetime"],
            sex: submissionData.sex,
            clientFirstName: submissionData.clientName["first"],
            clientLastName: submissionData.clientName["last"],
            clientEmail: submissionData.email,
            clientPhone: submissionData.phoneNumber["full"],
            clientAddress1: submissionData.address["addr_line1"],
            clientAddress2: submissionData.address["addr_line2"],

            // Urn Data
            urnChoice: submissionData.urnChoices,
        },
        function () {
            // Notify that we saved the data
            statusMessage.textContent = "Data saved successfully!";
        }
    );
}

function gatherAdditionalPetInformation(submissionData) {
    const { species, sex } = submissionData;
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

    submissionData.cuteSpecies = cuteSpecies;
    submissionData.pronoun1 = pronoun1;
    submissionData.pronoun2 = pronoun2;

    return submissionData;
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

//Use when scope changes
/* function reAuthenticate(callback) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError || !token) {
            console.error(chrome.runtime.lastError);
            return;
        }
        // Remove the cached token to force re-authentication
        chrome.identity.removeCachedAuthToken({ token: token }, function() {
            // Get a new token
            chrome.identity.getAuthToken({ interactive: true }, function(newToken) {
                if (chrome.runtime.lastError || !newToken) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                callback(newToken);
            });
        });
    });
} */

function makeApiCall(url, method, data, token, callback) {
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
                    throw new Error(
                        `API call failed with status ${response.status}: ${errData.error.message}`
                    );
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

function createGoogleDoc(callback) {
    authenticateGoogle(function (token) {
        const url = "https://docs.googleapis.com/v1/documents";
        const data = { title: "New Document" };

        makeApiCall(url, "POST", data, token, function (error, response) {
            if (error) {
                console.error("Error creating document:", error);
                return;
            }
            console.log("%cDocument created:", "color: green", response);
            callback(response);
        });
    });
}

function deleteDocument(docId) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    console.log(
                        "%cDocument deleted successfully",
                        "color: green"
                    );
                } else {
                    console.error("Failed to delete document");
                }
            })
            .catch((error) => {
                console.error("Error deleting document:", error);
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
            console.log(
                "%cDocument copied successfully:",
                "color: green",
                response
            );
            callback(response.id); // Get the new document's ID
        });
    });
}

function replaceTextInDocument(docId, replacements, callback) {
    authenticateGoogle(function (token) {
        const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;

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

function createDocFromTemplate(templateDocId, title, replacements, callback) {
    copyTemplate(templateDocId, title, function (newDocId) {
        replaceTextInDocument(newDocId, replacements, function (response) {
            callback(newDocId); // Return the new document's ID
        });
    });
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
        const email = [
            `Content-Type: text/html; charset=UTF-8`,
            `To: ${to}`,
            `Subject: ${subject}`,
            "",
            body,
        ].join("\r\n"); // Use CRLF (\r\n) as per RFC 5322

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
