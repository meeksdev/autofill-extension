/**
 * Listens for messages from the Chrome runtime and performs actions based on the message type and action.
 * @param {Object} message - The message object received from the Chrome runtime.
 * @param {string} message.action - The action to be performed.
 * @param {string} message.type - The type of the message.
 */
chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'createFormButton') {
        const { type } = message;
        if (type === 'NEW') {
            createFormButtonModal();
        }
    }
});

/**
 * Creates and displays a modal window with buttons for filling forms and emails.
 * If a modal already exists, it will be displayed and reset.
 */
function createFormButtonModal() {
    // Check if modal already exists
    const existingAutofillModal = document.getElementById('AutofillModal');
    if (existingAutofillModal) {
        existingAutofillModal.style.display = 'flex';

        const sympathyDocsButton = document.getElementById('AutofillModal-DocsAndEmailButton');
        sympathyDocsButton.textContent = 'Build Sympathy Card and Envelope';
        sympathyDocsButton.style.color = '#fff';
        sympathyDocsButton.style.backgroundColor = '#4285f4';
        sympathyDocsButton.style.cursor = 'pointer';
        sympathyDocsButton.disabled = false;

        const snapVetButton = document.getElementById('AutofillModal-SnapVetButton');
        snapVetButton.textContent = 'Create Client/Patient In SnapVet';
        snapVetButton.style.color = '#fff';
        snapVetButton.style.backgroundColor = '#4285f4';
        snapVetButton.style.cursor = 'pointer';
        snapVetButton.disabled = false;

        const loadingText = document.getElementById('autofillModal-LoadingText');
        loadingText.style.display = 'none';

        return; // Don't create a new modal if one already exists
    }

    // Create modal/popup element
    const modal = document.createElement('div');
    modal.id = 'AutofillModal';
    modal.style.backgroundColor = '#fff';
    modal.style.position = 'fixed';
    modal.style.top = '50px';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, 0)';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.gap = '10px';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
    modal.style.padding = '10px 20px';
    modal.style.maxWidth = '400px';
    modal.style.borderRadius = '5px';

    // Create description Text
    const step1Text = document.createElement('p');
    step1Text.innerHTML = 'Would you like to use this information to build a sympathy card and envelope?';

    // Create the docsAndEmailButton element
    const sympathyDocsButton = document.createElement('button');
    sympathyDocsButton.textContent = 'Build Sympathy Card and Envelope';
    sympathyDocsButton.style.backgroundColor = '#4285f4';
    sympathyDocsButton.style.color = '#fff';
    sympathyDocsButton.style.borderRadius = '5px';
    sympathyDocsButton.style.cursor = 'pointer';
    sympathyDocsButton.style.padding = '10px 20px';
    sympathyDocsButton.id = 'AutofillModal-DocsAndEmailButton';

    // Create the snapVetButton element
    const snapVetButton = document.createElement('button');
    snapVetButton.textContent = 'Create Client/Patient In SnapVet';
    snapVetButton.style.backgroundColor = '#4285f4';
    snapVetButton.style.color = '#fff';
    snapVetButton.style.borderRadius = '5px';
    snapVetButton.style.cursor = 'pointer';
    snapVetButton.style.padding = '10px 20px';
    snapVetButton.id = 'AutofillModal-SnapVetButton';

    // Add a close button to the modal
    const closeButton = document.createElement('div');
    closeButton.innerHTML = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.fontSize = '20px';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.cursor = 'pointer';

    const loadingText = document.createElement('p');
    loadingText.innerHTML = 'Loading... Please wait...';
    loadingText.style.display = 'none';
    loadingText.id = 'autofillModal-LoadingText';

    modal.appendChild(closeButton);
    modal.appendChild(step1Text);
    modal.appendChild(sympathyDocsButton);
    modal.appendChild(snapVetButton);
    modal.appendChild(loadingText);

    // Append the button to the body of the webpage
    document.body.appendChild(modal);

    // Add an event listener to the button
    sympathyDocsButton.addEventListener('click', () => {
        sympathyDocsButton.style.backgroundColor = '#b8cff5';
        sympathyDocsButton.style.cursor = 'progress';
        sympathyDocsButton.disabled = true;
        loadingText.style.display = 'block';

        // Extract the form ID from the URL
        //const urlPath = window.location.pathname;
        //const submissionId = urlPath.split('/').pop(); // Gets the last part of the URL path
        //console.log('%cSubmission ID from URL:', 'color: green', submissionId);

        // Get Data from the page
        const clientAndPetData = GetClientAndPetDataFromPage();
        console.log(clientAndPetData);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'fillSympathyCardAndEnvelope', data: clientAndPetData }, async function (response) {
            if (response.success) {
                console.log('%cForm Submission:', 'color: green', response.data);
                sympathyDocsButton.textContent = 'Completed.';

                sympathyDocsButton.style.color = 'green';
                sympathyDocsButton.style.cursor = 'default';
                sympathyDocsButton.style.backgroundColor = '#fff';
                loadingText.style.display = 'none';

                // window.open(`https://mail.google.com/mail/u/0/#drafts/${response.draftId}`, '_blank');
                if (response.data.letterDocId) printGoogleDoc(response.data.letterDocId);
                if (response.data.envelopeDocId) printGoogleDoc(response.data.envelopeDocId);
                // if (response.data.invoiceDocId) printGoogleDoc(response.data.invoiceDocId);
                // if (response.data.invoiceDocId) window.open(`https://docs.google.com/document/d/${response.data.invoiceDocId}/edit`, '_blank');
            } else {
                console.error('Failed to Fill Docs and Email:', response.error);
                // alert(`Failed to Fill Crematory Site. ${response.error}`);
                sympathyDocsButton.textContent = `Failed: ${response.error}`;
                sympathyDocsButton.style.backgroundColor = '#fff';
                sympathyDocsButton.style.color = 'red';
                sympathyDocsButton.style.cursor = 'default';
                loadingText.style.display = 'none';
            }
        });
    });

    snapVetButton.addEventListener('click', () => {
        snapVetButton.style.backgroundColor = '#b8cff5';
        snapVetButton.style.cursor = 'progress';
        snapVetButton.disabled = true;
        loadingText.style.display = 'block';

        // Extract the form ID from the URL
        //const urlPath = window.location.pathname;
        //const submissionId = urlPath.split('/').pop(); // Gets the last part of the URL path
        //console.log('%cSubmission ID from URL:', 'color: green', submissionId);

        // Get Data from the page
        const clientAndPetData = GetClientAndPetDataFromPage();
        console.log(clientAndPetData);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'addClientAndPatientOnVetSnap', data: clientAndPetData }, async function (response) {
            if (response.success) {
                console.log('%cForm Submission:', 'color: green', response.data);
                // modal.style.display = "none";
                loadingText.style.display = 'none';
            } else {
                console.error('Failed to Fill VetSnap Client Site:', response.error);
                // alert(`Failed to Fill Crematory Site. ${response.error}`);
                snapVetButton.textContent = `Failed: ${response.error}`;
                snapVetButton.style.backgroundColor = '#fff';
                snapVetButton.style.color = 'red';
                snapVetButton.style.cursor = 'default';
                loadingText.style.display = 'none';
            }
        });
    });

    /* crematoryButton.addEventListener('click', () => {
        crematoryButton.style.backgroundColor = '#b8cff5';
        crematoryButton.style.cursor = 'progress';
        crematoryButton.disabled = true;
        loadingText.style.display = 'block';

        // Extract the form ID from the URL
        const urlPath = window.location.pathname;
        const submissionId = urlPath.split('/').pop(); // Gets the last part of the URL path
        console.log('%cSubmission ID from URL:', 'color: green', submissionId);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'fillCrematoryForms', submissionId: submissionId }, async function (response) {
            if (response.success) {
                console.log('%cForm Submission:', 'color: green', response.data);
                // modal.style.display = "none";
                loadingText.style.display = 'none';

                console.log(response.data.cremationType);
                if (response.data.cremationType !== 'Retain') {
                    crematoryButton.textContent = 'Completed.';
                    crematoryButton.style.color = 'green';
                    crematoryButton.style.backgroundColor = '#fff';
                    chrome.runtime.sendMessage({ action: 'startNewOrder' });
                } else {
                    console.log('Client Will Retain Remains');
                    crematoryButton.textContent = 'Client Will Retain Remains.';
                    crematoryButton.style.color = 'black';
                    crematoryButton.style.cursor = 'default';
                    crematoryButton.style.backgroundColor = '#fff';
                }
            } else {
                console.error('Failed to Fill Crematory Site:', response.error);
                // alert(`Failed to Fill Crematory Site. ${response.error}`);
                crematoryButton.textContent = `Failed: ${response.error}`;
                crematoryButton.style.backgroundColor = '#fff';
                crematoryButton.style.color = 'red';
                crematoryButton.style.cursor = 'default';
                loadingText.style.display = 'none';
            }
        });
    }); */

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function GetClientAndPetDataFromPage() {
    const data = {};

    // ---Get Client Info Section---
    const clientInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Client Info').parentElement.parentElement
        .parentElement;

    // Get Client Name
    const clientName = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Name:').nextSibling;
    data.clientName = {
        //fullName: clientName.textContent.trim(),
        firstName: clientName.childNodes[0].textContent.trim(),
        lastName: clientName.childNodes[2].textContent.trim(),
    };
    data.clientName.fullName = `${data.clientName.firstName} ${data.clientName.lastName}`;

    // phone number
    const clientNumber = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Phone (Primary):').nextSibling.firstChild;
    data.clientNumber = clientNumber.textContent.trim();

    // email
    const clientEmail = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Email:').nextSibling;
    data.clientEmail = clientEmail.textContent.trim();

    // ---Get Pet Info Section---
    const petInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Patients & Services').parentElement
        .parentElement.parentElement;

    // Get Pet Name
    const petName = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Name:').parentElement.nextSibling
        .firstChild.firstChild;
    data.petName = petName.textContent.trim();

    // species
    const petSpecies = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Species:').parentElement.nextSibling;
    data.petSpecies = petSpecies.textContent.trim();

    // sex
    const petSex = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Sex:').parentElement.nextSibling;
    data.petSex = petSex.textContent.trim();

    // pronoun1 (handle in background)
    // pronoun2 (handle in background)

    // Get Appointment Info
    const appointmentInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Appointment Info').parentElement
        .parentElement.parentElement;
    const clientAddress = Array.from(appointmentInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Address:').nextSibling.firstChild; // address
    data.clientAddress = {
        line1: clientAddress.childNodes[0].textContent.trim(),
        line2: clientAddress.childNodes[2].textContent.trim(),
    };
    Object.assign(data.clientAddress, parseAddress(data.clientAddress.line1, data.clientAddress.line2));

    return data;
}

/**
 * Sends a message to the background script to open and print a Google Doc.
 * @param {string} docId - The ID of the Google Doc to be printed.
 */
function printGoogleDoc(docId) {
    chrome.runtime.sendMessage({ action: 'openAndPrintDoc', docId: docId });
}

/* function printCurrentWindow() {
    window.print();
} */


function parseAddress(addressLine1, addressLine2) {
    console.log("AddressLine1:", addressLine1);
    console.log("AddressLine2:", addressLine2);

    const street = addressLine1.trim();

    // Match city, state (abbr or full name), and zip
    const cityStateZip = addressLine2.trim();
    const cityMatch = cityStateZip.match(/^(.+?),\s*([A-Za-z]{2,})\s+(\d{5}(?:-\d{4})?)$/);

    if (!cityMatch) {
        throw new Error("Unexpected address format");
    }

    return {
        street,
        city: cityMatch[1],
        state: cityMatch[2], // could be "NV" or "Nevada"
        zip: cityMatch[3],
    };
}

