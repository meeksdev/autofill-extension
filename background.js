/**
 * Listens for updates to any tab and performs actions based on the tab's URL and status.
 * @param {number} tabId - The ID of the tab that was updated.
 * @param {Object} changeInfo - An object containing properties about how the tab was changed.
 * @param {string} changeInfo.status - The status of the tab (e.g., 'loading', 'complete').
 * @param {Object} tab - The details of the tab that was updated.
 * @param {string} tab.url - The URL of the tab that was updated.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page is fully loaded
    chrome.storage.local.get(['jotformFormId'], function (result) {
        const jotformFormId = result.jotformFormId;
        console.log('%cRetrieved JotForm form ID: ', 'color: green;', jotformFormId);

        // Jotform
        if (changeInfo.status === 'complete' && tab.url && tab.url.includes(`jotform.com/inbox/${jotformFormId}`)) {
            chrome.tabs.sendMessage(tabId, {
                action: 'createFormButton',
                type: 'NEW',
            });
        }
        // Google Calendar
        else if (changeInfo.status === 'complete' && tab.url && tab.url.includes('eventedit')) {
            chrome.tabs.sendMessage(tabId, {
                action: 'createJotformLinkButton',
                type: 'NEW',
            });
        }
    });
});

/**
 * Listens for messages from other parts of the extension and performs actions based on the message action.
 * @param {Object} message - The message object received.
 * @param {string} message.action - The action to be performed.
 * @param {string} [message.submissionId] - The ID of the JotForm submission (if applicable).
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - The function to call to send a response.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillDocsAndEmail') {
        const submissionId = message.submissionId;

        chrome.storage.local.get(['jotformToken'], function (result) {
            const jotformToken = result.jotformToken;
            if (!jotformToken) {
                sendResponse({
                    success: false,
                    error: 'Could not obtain Jotform API key. Check settings.',
                });
            }
            console.log('%cRetrieved JotForm token: ', 'color: green', jotformToken);

            fetch(`https://api.jotform.com/submission/${submissionId}?apiKey=${jotformToken}`)
                .then(response => response.json())
                .then(handleData)
                .then(storeJotformData)
                .then(createGmailDraft)
                .then(deleteOldDocs)
                .then(createInvoice)
                .then(createLetter)
                .then(createEnvelope)
                .then(data => {
                    console.log('All tasks completed successfully with data:', data);
                    sendResponse({ success: true, data: data });
                })
                .catch(error => {
                    console.error('Error during data processing:', error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true; // Keep the messaging channel open for async response
    } else if (message.action === 'fillCrematoryForms') {
        const submissionId = message.submissionId;

        chrome.storage.local.get(['jotformToken'], function (result) {
            const jotformToken = result.jotformToken;
            console.log('%cRetrieved JotForm token: ', 'color: green', jotformToken);

            fetch(`https://api.jotform.com/submission/${submissionId}?apiKey=${jotformToken}`)
                .then(response => response.json())
                .then(handleData)
                .then(storeJotformData)
                .then(data => {
                    console.log('All tasks completed successfully with data:', data);
                    sendResponse({ success: true, data: data });
                })
                .catch(error => {
                    console.error('Error during data processing:', error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true; // Keep the messaging channel open for async response
    } else if (message.action === 'startNewOrder') {
        console.log('startNewOrder');
        const crematoryUrl = 'https://www.pawsetrack.vet/app/dashboard';
        chrome.tabs.create({ url: crematoryUrl }, function (tab) {
            chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'startNewOrder',
                        type: 'NEW',
                        tabId: tabId,
                    });
                    chrome.tabs.onUpdated.removeListener(onTabUpdated);
                }
            });
        });

        /* chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const targetTabId = message.targetTabId || tabs[0].id;
            console.log(targetTabId);
            chrome.tabs.sendMessage(targetTabId, {
                action: 'startNewOrder',
                type: 'NEW',
            });
        }); */
    } else if (message.action === 'selectCremationType') {
        console.log('selectCremationType');
        chrome.tabs.sendMessage(message.tabId, {
            action: 'selectCremationType',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'fillPetAndOwnerForm') {
        chrome.tabs.sendMessage(message.tabId, {
            action: 'fillPetAndOwnerForm',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'fillBundlesForm') {
        chrome.tabs.sendMessage(message.tabId, {
            action: 'fillBundlesForm',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'selectUrn') {
        chrome.tabs.sendMessage(message.tabId, {
            action: 'selectUrn',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'fillMemorialForm') {
        chrome.tabs.sendMessage(message.tabId, {
            action: 'fillMemorialForm',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'fillReviewForm') {
        chrome.tabs.sendMessage(message.tabId, {
            action: 'fillReviewForm',
            type: 'NEW',
            tabId: message.tabId,
        });
    } else if (message.action === 'openAndPrintDoc') {
        const docUrl = `https://docs.google.com/document/d/${message.docId}/edit`;
        chrome.tabs.create({ url: docUrl }, function (tab) {
            chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'printDoc',
                        docId: message.docId,
                    });
                    chrome.tabs.onUpdated.removeListener(onTabUpdated);
                }
            });
        });
    } else if (message.action === 'deleteDoc') {
        deleteDocument(message.docId);
    }
});

/**
 * Creates a Gmail draft using the provided data and sends it using Gmail API.
 * @param {Object} data - The data used to create the Gmail draft.
 * @param {string} data.dateOf6.datetime - The datetime of the scheduled appointment.
 * @param {string} data.nameOf - The name of the patient/pet.
 * @param {Object} data.clientName - The client's name.
 * @param {string} data.clientName.first - The client's first name.
 * @param {string} data.clientName.last - The client's last name.
 * @param {Object} data.address - The address of the client.
 * @param {string} data.address.addr_line1 - The first line of the client's address.
 * @param {string} data.address.addr_line2 - The second line of the client's address (optional).
 * @param {string} data.cityStatePostal - The city, state, and postal code of the client.
 * @param {Object} data.phoneNumber - The client's phone number.
 * @param {string} data.phoneNumber.full - The full phone number.
 * @returns {Object} The input data object (unchanged).
 */
function createGmailDraft(data) {
    console.log('Creating and sending Gmail draft with data:', data);
    const formattedDate = new Date(data.dateOf6['datetime']).toLocaleString();

    const emailBody = `
    <p style="margin: 0";>Patient: ${data.nameOf}</p>
    <p style="margin: 0";>Date of Scheduled Appointment: ${formattedDate}</p>
    <p style="margin: 0";>Client Name: ${data.clientName['first']} ${data.clientName['last']}</p>
    <p style="margin: 0";>Address: ${data.address['addr_line1']} ${data.address['addr_line2']}</p>
    <p style="margin: 0";>         ${data.cityStatePostal}</p>
    <p style="margin: 0";>Phone Number: ${data.phoneNumber['full']}</p>

    <p style="margin: 32px 0";><strong>Pet’s ashes and/or memorial products will be delivered to your hospital by West Coast Pet Memorial. Please call the owner when they are ready to be picked-up.</strong></p>

    <p style="margin: 16px 0";>Dear Doctors and Staff,</p>

    <p style="margin: 16px 0";>I regret to inform you of the passing of our mutual patient, ${data.nameOf}, who was humanely euthanized in the comfort of home due to declining quality of life. My condolences for the loss of your patient.<p>

    <p style="margin: 16px 0";>I sincerely appreciate your referral and time. Please do not hesitate to contact me with any questions.</p>

    <div;>
        <b>Sarena Olsen, MS, DVM, CPEV</b>
    </div>
    <div>Peace for Paws: Private In-Home Pet Euthanasia</div>
    <div>
        <a
            href="http://peaceforpawsvet.com/"
            target="_blank"
            data-saferedirecturl="https://www.google.com/url?q=http://peaceforpawsvet.com&amp;amp;source=gmail&amp;amp;ust=1727114730157000&amp;amp;usg=AOvVaw3sjhFcQA18PE8JVA6NEa0Z"
            >peaceforpawsvet.com</a
        >
    </div>
    <div>(702) 530-8262</div>
    <div>
        <img
            width="200"
            height="87"
            src="https://ci3.googleusercontent.com/mail-sig/AIorK4ybvt6BB2r5cFrbGOG1ZSBCeB2ge2U7hNDALg-hvDcZR55HRlQbo5GnBV96TRyNGdxiWXiE3C5NnhzZ"
            class="CToWUd"
            data-bit="iit"
        />
    </div>
`;
    sendGmailDraft('', `Notification of Euthanasia`, emailBody, function (error, response) {
        if (error) {
            console.error('Failed to create Gmail draft:', error.message);
            return;
        }
        console.log('%cGmail draft created successfully:', 'color: green', response);
    });

    return data;
}

/**
 * Sends a Gmail draft using Gmail API.
 * @param {string} to - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} body - The body of the email, in HTML format.
 * @param {Function} callback - The callback function to handle success or error.
 */
function sendGmailDraft(to, subject, body, callback) {
    authenticateGoogle(function (token) {
        if (!token) {
            console.error('Authentication failed: No token received.');
            return callback(new Error('Authentication failed.'));
        }

        const url = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts';

        // Construct the raw email content with HTML
        const email = [`Content-Type: text/html; charset=UTF-8`, `To: ${to}`, `Subject: ${subject}`, '', body].join('\r\n'); // Use CRLF (\r\n) as per RFC 5322

        // Encode the email in base64url format
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const data = {
            message: {
                raw: base64EncodedEmail,
            },
        };

        makeApiCall(url, 'POST', data, token, function (error, response) {
            if (error) {
                console.error('Error creating Gmail draft:', error);
                return callback(error);
            }
            console.log('%cDraft created:', 'color: green', response);
            callback(null, response);
        });
    });
}

/**
 * Processes the raw data, extracts relevant form data, gathers additional information,
 * and adds submission date to the data.
 * @param {Object} data - The raw data to be processed.
 * @param {Object} data.content.answers - The answers from the form submission.
 * @param {string} data.content.created_at - The timestamp of the form submission.
 * @returns {Promise<Object>} A promise that resolves to the processed submission data.
 */
async function handleData(data) {
    console.log('Step 1: Handle Raw Data', data);
    let submissionData = extractFormData(data.content.answers);
    submissionData = await gatherAdditionalInformation(submissionData); // Await this as it's asynchronous
    submissionData.submissionDate = data.content.created_at;
    console.log('%cSubmission Data Retrieved Successfully:', 'color: green', submissionData);
    return submissionData;
}

/**
 * Extracts form data from raw submission answers and processes address information.
 * @param {Object} data - The raw form submission answers.
 * @returns {Object} The processed form data, including address and other fields.
 */
function extractFormData(data) {
    const formData = {};

    Object.values(data).forEach(field => {
        if (field.name && field.answer) {
            if (typeof field.answer === 'string') {
                if (field.answer.includes('\r\n')) {
                    const parsedAnswer = {};
                    field.answer.split('\r\n').forEach(line => {
                        const [key, value] = line.split(':').map(item => item.trim());
                        if (key && value) {
                            parsedAnswer[key] = value;
                        }
                    });
                    formData[field.name] = parsedAnswer;
                } else {
                    formData[field.name] = field.answer.trim();
                }
            } else if (typeof field.answer === 'object' && field.answer !== null) {
                Object.entries(field.answer).forEach(([key, value]) => {
                    field.answer[key] = value.trim();
                });
                formData[field.name] = field.answer;
            } else {
                formData[field.name] = field.answer;
            }
        }
    });

    // Check if the old address or new address is being used and handle it accordingly
    if (formData.addressAuto) {
        if (!formData.address) formData.address = {};
        formData.address['addr_line1'] = `${formData.addressAuto['Building number']} ${formData.addressAuto['Street name']}`;
        formData.address['addr_line2'] = formData.aptNumber ? `#${formData.aptNumber}` : '';
        formData.address['city'] = formData.addressAuto['City'];
        formData.address['state'] = formData.addressAuto['State'];
        formData.address['postal'] = formData.addressAuto['Postal code'];
    }

    console.log('%cForm Data Extraction Successful:', 'color: green', formData);
    return formData;
}

/**
 * Gathers additional information from the provided data object.
 * This function processes data about a pet (species, sex, address) and adds
 * additional context to it (such as "cuteSpecies" and pronouns based on the pet's sex).
 * It also maps cremation types and collection locations to human-readable formats.
 * Finally, it retrieves specific keys from Chrome's local storage and merges them
 * into the data object before resolving the promise.
 *
 * @param {Object} data - The data object containing pet and client details.
 * @returns {Promise<Object>} - A promise that resolves to the updated data object with additional information.
 */
async function gatherAdditionalInformation(data) {
    console.log('Step 2: Gather Additional Information');

    const { species, sex, address } = data;
    let cuteSpecies, pronoun1, pronoun2;

    if (species === 'Dog') {
        cuteSpecies = 'pup';
    } else if (species === 'Cat') {
        cuteSpecies = 'kitty';
    }

    if (sex === 'Male') {
        pronoun1 = 'him';
        pronoun2 = 'he';
    } else if (sex === 'Female') {
        pronoun1 = 'her';
        pronoun2 = 'she';
    }

    data.cuteSpecies = cuteSpecies;
    data.pronoun1 = pronoun1;
    data.pronoun2 = pronoun2;

    console.log(data.address);
    data.cityStatePostal = `${address['city']}, ${address['state']} ${address['postal']}`;
    console.log(data.cityStatePostal);

    data.cremationType = data.cremationType.includes('PRIVATE cremation')
        ? 'Private'
        : data.cremationType.includes('MEMORIAL cremation')
        ? 'Memorial'
        : 'Retain';

    data.collectionLocation = !data.collectionLocation
        ? ''
        : data.collectionLocation.includes('office')
        ? 'Office'
        : data.collectionLocation.includes('pick-up')
        ? 'Pick-up'
        : data.collectionLocation.includes('mailed')
        ? 'Mailed'
        : 'Sarena';

    data.pawOrNosePrint = data.privatePawOrNosePrint ? data.privatePawOrNosePrint : data.memorialPawOrNosePrint;

    const storageKeys = [
        'invoiceTemplateId',
        'letterTemplateId',
        'envelopeTemplateId',
        'euthanasiaPrice',
        'smallPrivateCremationPrice',
        'largePrivateCremationPrice',
        'smallMemorialCremationPrice',
        'largeMemorialCremationPrice',
        'furPrice',
        'furAndBoxPrice',
        'clayPawPrice',
        'clayNosePrice',
        'pawPrintPrice',
        'nosePrintPrice',
        // "cremationType",
    ];

    return new Promise((resolve, reject) => {
        chrome.storage.local.get(storageKeys, function (items) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                Object.assign(data, items);
                console.log('Additional information gathered:', data);
                resolve(data); // Resolve the promise once data is gathered
            }
        });
    });
}

/**
 * Stores form data from Jotform into Chrome's local storage.
 * It processes data like engraving information, additional products (e.g., fur clippings),
 * client and pet details, and urn engraving, then saves this data in local storage.
 *
 * @param {Object} data - The data object containing Jotform responses.
 * @returns {Promise<Object>} - A promise that resolves once the data is successfully stored.
 */
async function storeJotformData(data) {
    console.log('Step 3: Store Jotform Data', data);

    let isUrnEngraved = false;
    let urnLine1, urnLine2, urnLine3, urnLine4;
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
    if (!urnLine1) urnLine1 = '';
    if (!urnLine2) urnLine2 = '';
    if (!urnLine3) urnLine3 = '';
    if (!urnLine4) urnLine4 = '';

    if (!data.clayNosePrint) data.clayNosePrint = 0;
    if (!data.clayPawPrint) data.clayPawPrint = 0;
    if (!data.additionalBoxedFurClipping) data.additionalBoxedFurClipping = 0;
    if (!data.additionalFurClipping) data.additionalFurClipping = 0;
    if (!data.additionalNosePrint) data.additionalNosePrint = 0;
    if (!data.additonalPawPrint) data.additonalPawPrint = 0;

    let clientApartmentNumber = data.address['addr_line2'] || '';

    return new Promise((resolve, reject) => {
        chrome.storage.local.set(
            {
                cremationType: data.cremationType,
                petName: capitalizeWords(data.nameOf),
                species: data.species,
                breed: data.breed,
                weight: data.approximateWeight,
                passingDate: data.dateOf6['datetime'],
                sex: data.sex,
                age: data.age,
                clientFirstName: capitalizeWords(data.clientName['first']),
                clientLastName: capitalizeWords(data.clientName['last']),
                clientEmail: data.email,
                clientPhone: data.phoneNumber['full'],
                clientAddress1: `${capitalizeWords(data.address['addr_line1'])} ${data.address['addr_line2']}`,
                clientAddress2: `${capitalizeWords(data.address['city'])}, ${data.address['state'].toUpperCase()} ${data.address['postal']}`,
                clientApartmentNumber: clientApartmentNumber,
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
                additionalPawPrint: data.additionalPawPrint,
                collectionLocation: data.collectionLocation,
                petHospital: data.petHospital,
            },
            function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    console.log('Data saved successfully!');
                    resolve(data); // Resolve once the storage operation is complete
                }
            }
        );
    });
}

/**
 * Creates an invoice using a template based on the gathered data.
 * It prepares the product details (euthanasia, cremation, additional services),
 * formats them into a product list, and populates a Google Docs invoice template.
 * The function creates the document, then saves the new document ID into the data object.
 *
 * @param {Object} data - The data object with invoice-relevant details.
 * @returns {Promise<Object>} - A promise that resolves with the updated data object containing the new invoice document ID.
 */
function createInvoice(data) {
    return new Promise((resolve, reject) => {
        console.log('Create Invoice');

        // if did not request an itemized invoice then do not go through with the rest of the code
        if (data.itemizedReceipt !== 'Yes') {
            console.log('No itemized Receipt');
            return resolve(data);
        }

        if (!data.invoiceTemplateId) {
            console.log('Invoice Template ID is missing or empty');
            return reject(new Error('Could not obtain Invoice Template ID. Check settings.'));
        }

        const currentDate = new Date().toLocaleDateString('en-US');

        let products = [];
        // Euthanasia
        products.push({
            name: 'Euthanasia',
            subtotal: data.euthanasiaPrice,
        });
        // Cremation
        if (data.cremationType === 'Private' && data.approximateWeight < 80) {
            products.push({
                name: 'Private Cremation (< 80lbs)',
                subtotal: parseFloat(data.smallPrivateCremationPrice),
            });
        } else if (data.cremationType === 'Private' && data.approximateWeight >= 80) {
            products.push({
                name: 'Private Cremation (>= 80lbs)',
                subtotal: parseFloat(data.largePrivateCremationPrice),
            });
        } else if (data.cremationType === 'Memorial' && data.approximateWeight < 80) {
            products.push({
                name: 'Memorial Cremation (< 80lbs)',
                subtotal: parseFloat(data.smallPrivateCremationPrice),
            });
        } else if (data.cremationType === 'Memorial' && data.approximateWeight >= 80) {
            products.push({
                name: 'Memorial Cremation (>= 80lbs)',
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

        console.log('Made it 1');

        const subtotal = products.reduce((total, product) => total + (parseFloat(product.subtotal) || 0), 0);
        const paid = subtotal;
        const total = subtotal - paid;

        //format subtotals as currency
        products.forEach(product => {
            product.subtotal = formatAsCurrency(product.subtotal);
        });

        // if products array is not filled with all 8 products then we need to fill with empty spaces
        while (products.length < 8) {
            products.push({ name: '', subtotal: '' });
        }

        createDocFromTemplate(data.invoiceTemplateId, `(Invoice) ${data.nameOf}'s Passing ${data.submissionDate}`, {
            Date: currentDate,
            ClientName: `${data.clientName['first']} ${data.clientName['last']}`,
            Address: `${data.address['addr_line1']} ${data.address['addr_line2']}
                    ${data.cityStatePostal}`,
            PhoneNumber: data.phoneNumber['full'],
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
        })
            .then(newDocId => {
                // If the document creation is successful, log and resolve
                console.log('%cNew invoice document created with ID:', 'color: green', newDocId);
                data.invoiceDocId = newDocId; // Save the new document ID in `data`
                resolve(data); // Resolve with the updated `data` object
            })
            .catch(error => {
                // If there is any error, log and reject
                console.error('Error in createInvoice:', error);
                reject(error); // Reject the promise with the error
            });
    });
}

/**
 * Formats a given value as currency in USD.
 * @param {number} value - The value to format as currency.
 * @returns {string} - The formatted currency string.
 */
function formatAsCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

/**
 * Creates a new document from a template, replacing placeholders with actual data.
 * @param {string} templateDocId - The ID of the template document to copy.
 * @param {string} title - The title of the new document.
 * @param {Object} replacements - An object containing key-value pairs for placeholder replacements.
 * @returns {Promise<string>} - A promise that resolves with the new document's ID.
 */
function createDocFromTemplate(templateDocId, title, replacements) {
    return new Promise((resolve, reject) => {
        console.log('Starting to copy template...');

        copyTemplate(templateDocId, title, function (error, newDocId) {
            if (error) {
                console.error('Error copying template:', error.message);
                return reject(new Error('Error copying template: ' + error.message));
            }
            console.log('Template copied successfully. New Doc ID:', newDocId);

            const newDoc = {
                id: newDocId,
                creationDate: new Date().toISOString(),
            };
            chrome.storage.local.get(['recentDocs'], function (result) {
                let recentDocs = result.recentDocs;
                if (!recentDocs) recentDocs = [];

                recentDocs.push(newDoc);

                chrome.storage.local.set({ recentDocs: recentDocs }, function () {
                    console.log('Recent documents updated successfully', recentDocs);
                });
            });

            console.log('Starting text replacement...');
            replaceTextInDocument(newDocId, replacements, function (error) {
                if (error) {
                    console.error('Error replacing text:', error.message);
                    return reject(new Error('Error replacing text: ' + error.message));
                }

                console.log('Text replaced successfully in document:', newDocId);
                resolve(newDocId); // Resolve the promise with the new document's ID
            });
        });
    });
}

/**
 * Copies a Google Docs template and creates a new document.
 * @param {string} templateDocId - The ID of the template document.
 * @param {string} title - The title of the new document.
 * @param {function} callback - The callback function to handle the response or error.
 */
function copyTemplate(templateDocId, title, callback) {
    console.log('Copying template with ID:', templateDocId, 'and Title:', title);

    authenticateGoogle(function (token) {
        const url = `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`;
        const data = { name: title };

        makeApiCall(url, 'POST', data, token, function (error, response) {
            if (error) {
                console.error('Error during template copy:', error.message);
                return callback(error); // Pass the error to the callback
            }

            console.log('Template copy succeeded. Response:', response);
            callback(null, response.id); // Return the new document ID
        });
    });
}

/**
 * Replaces placeholders in a Google Doc with actual text.
 * @param {string} docId - The ID of the document to modify.
 * @param {Object} replacements - An object containing key-value pairs for placeholder replacements.
 * @param {function} callback - The callback function to handle the response or error.
 */
function replaceTextInDocument(docId, replacements, callback) {
    console.log('Replacing text in document with ID:', docId);

    authenticateGoogle(function (token) {
        const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;

        const requests = Object.keys(replacements).map(key => ({
            replaceAllText: {
                containsText: {
                    text: `{{${key}}}`,
                    matchCase: true,
                },
                replaceText: replacements[key],
            },
        }));

        const data = { requests: requests };

        makeApiCall(url, 'POST', data, token, function (error, response) {
            if (error) {
                console.error('Error during text replacement:', error.message);
                return callback(error); // Pass the error to the callback
            }

            console.log('Text replacement succeeded. Response:', response);
            callback(null, response);
        });
    });
}

/**
 * Authenticates the user with Google to obtain an OAuth token.
 * @param {function} callback - The callback function to receive the token or handle errors.
 */
function authenticateGoogle(callback) {
    console.log('Starting Google authentication...');

    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
            console.error('Authentication failed:', chrome.runtime.lastError);
            return callback(new Error('Authentication failed.'));
        }

        console.log('Authentication successful. Token received:', token);
        callback(token);
    });
}

/**
 * Makes an authenticated API call to Google services.
 * @param {string} url - The URL of the API endpoint.
 * @param {string} method - The HTTP method (GET, POST, etc.).
 * @param {Object} data - The request payload.
 * @param {string} token - The OAuth token for authorization.
 * @param {function} callback - The callback function to handle the response or error.
 */
function makeApiCall(url, method, data, token, callback) {
    console.log('Making API call to:', url, 'with data:', data);

    fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    console.error('API call failed:', errData);
                    throw new Error(`API call failed with status ${response.status}: ${errData.error.message}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('API call succeeded with data:', data);
            callback(null, data);
        })
        .catch(error => {
            console.error('API call error:', error.message);
            callback(error);
        });
}

/**
 * Creates a letter document based on provided data.
 * @param {Object} data - The data object containing template ID, client information, and other details.
 * @returns {Promise<Object>} - A promise that resolves with the updated data object containing the new document ID.
 */
async function createLetter(data) {
    console.log('Starting createLetter function');

    // Check for missing Letter Template ID
    if (!data.letterTemplateId) {
        console.error('Letter Template ID is missing or empty');
        throw new Error('Could not obtain Letter Template ID. Check settings.');
    }

    console.log('Letter Template ID:', data.letterTemplateId);

    try {
        console.log('Calling createDocFromTemplate...');

        const newDocId = await createDocFromTemplate(data.letterTemplateId, `(Letter) ${data.nameOf}'s Passing ${data.submissionDate}`, {
            familyName: data.clientName['last'],
            NameOfPet: data.nameOf,
            species: data.cuteSpecies,
            pronoun1: data.pronoun1,
            pronoun2: data.pronoun2,
        });

        console.log('createDocFromTemplate succeeded, new document ID:', newDocId);

        data.letterDocId = newDocId;
        console.log('Letter document ID saved in data:', data.letterDocId);

        return data; // Successfully return updated data
    } catch (error) {
        console.error('Error in createLetter:', error);
        throw error; // Propagate the error
    }
}

/**
 * Creates an envelope document based on provided data.
 * @param {Object} data - The data object containing template ID, client address information, and other details.
 * @returns {Promise<Object>} - A promise that resolves with the updated data object containing the new envelope document ID.
 */
function createEnvelope(data) {
    return new Promise((resolve, reject) => {
        console.log('Create Envelope');
        if (!data.envelopeTemplateId) {
            console.log('Envelope Template ID is missing or empty');
            return reject(new Error('Could not obtain Envelope Template ID. Check settings.'));
        }

        createDocFromTemplate(data.envelopeTemplateId, `(Envelope) ${data.nameOf}'s Passing ${data.submissionDate}`, {
            familyName: data.clientName['last'],
            AddressLine1: data.address['addr_line1'],
            AddressLine2: data.address['addr_line2'] || data.cityStatePostal,
            AddressLine3: data.address['addr_line2'] ? data.cityStatePostal : '',
        })
            .then(newDocId => {
                // If the document creation is successful, log and resolve
                console.log('%cNew envelope document created with ID:', 'color: green', newDocId);
                data.envelopeDocId = newDocId; // Save the new document ID in `data`
                resolve(data); // Resolve with the updated `data` object
            })
            .catch(error => {
                // If there is any error, log and reject
                console.error('Error in createEnvelope:', error);
                reject(error); // Reject the promise with the error
            });
    });
}

/**
 * Deletes old documents from Google Drive based on their creation date.
 * Documents older than 2 hours will be deleted.
 * @param {Object} data - The data object containing document information.
 * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
 */
function deleteOldDocs(data) {
    return new Promise(resolve => {
        console.log('Starting deleteOldDocs function');

        chrome.storage.local.get(['recentDocs'], function (result) {
            let docs = result.recentDocs;
            if (!docs) {
                console.log('No recent documents found');
                return resolve(data); // If no recent documents, resolve the promise
            }

            const currentDate = new Date();
            const newRecentDocs = docs.filter(doc => {
                if (!doc.creationDate) {
                    console.log('No creation date found for document:', doc);
                    return false;
                }

                const creationDate = new Date(doc.creationDate);
                if (isNaN(creationDate.getTime())) {
                    console.log('Invalid creation date for document:', doc);
                    return false;
                }

                if (currentDate - creationDate > 7200000) {
                    //if creation date was more than 2 hours ago...
                    deleteDocument(doc.id);
                    return false;
                } else {
                    return true;
                }
            });

            chrome.storage.local.set({ recentDocs: newRecentDocs }, function () {
                console.log('Recent documents updated successfully', newRecentDocs);
                resolve(data); // Resolve the promise with the updated recentDocs array
            });
        });
    });
}

/**
 * Deletes a document from Google Drive by its ID.
 * @param {string} docId - The ID of the document to delete.
 */
function deleteDocument(docId) {
    console.log('deleteDocument');
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(response => {
                if (response.ok) {
                    console.log('%cDocument deleted successfully', 'color: green');
                } else {
                    console.error('Failed to delete document');
                }
            })
            .catch(error => {
                console.error('Error deleting document:', error);
            });
    });
}

/**
 * Capitalizes the first letter of each word in a given string.
 * @param {string} str - The input string to capitalize.
 * @returns {string} - The input string with each word's first letter capitalized.
 */
function capitalizeWords(str) {
    return str
        .split(' ') // Split the string into an array of words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words back into a string
}
