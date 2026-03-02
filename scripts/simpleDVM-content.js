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
        let clientAndPetData;
        try {
            clientAndPetData = GetClientAndPetDataFromPage();
            console.log(clientAndPetData);
        } catch (error) {
            handleError("Failed to gather client and pet data:", error, sympathyDocsButton);
        }

        // Send a message to the background script to build google docs
        chrome.runtime.sendMessage({ action: 'fillSympathyCardAndEnvelope', data: clientAndPetData }, async function (response) {
            console.log("Response Received");
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
                handleError("Failed to Fill Docs and Email:", response.error, sympathyDocsButton);

                //console.error('Failed to Fill Docs and Email:', response.error);
                //// alert(`Failed to Fill Crematory Site. ${response.error}`);
                //sympathyDocsButton.textContent = `Failed: ${response.error}`;
                //sympathyDocsButton.style.backgroundColor = '#fff';
                //sympathyDocsButton.style.color = 'red';
                //sympathyDocsButton.style.cursor = 'default';
                //loadingText.style.display = 'none';
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
        let clientAndPetData;
        try {
            clientAndPetData = GetClientAndPetDataFromPage();
            console.log("clientAndPetData:", clientAndPetData);
        } catch (error) {
            handleError("Failed to gather client and pet data:", error, snapVetButton);
        }

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'addClientAndPatientOnVetSnap', data: clientAndPetData }, async function (response) {
            console.log("Response Received");
            if (response.success) {
                console.log('%cForm Submission:', 'color: green', response.data);
                // modal.style.display = "none";
                loadingText.style.display = 'none';
            } else {
                handleError("Failed to Fill VetSnap Client Site:", response.error, snapVetButton);
                /*console.error('Failed to Fill VetSnap Client Site:', response.error);
                // alert(`Failed to Fill Crematory Site. ${response.error}`);
                snapVetButton.textContent = `Failed: ${response.error}`;
                snapVetButton.style.backgroundColor = '#fff';
                snapVetButton.style.color = 'red';
                snapVetButton.style.cursor = 'default';
                loadingText.style.display = 'none';*/
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

    function handleError(errorMessage, error, button) {
        console.error(errorMessage, error);
        // alert(`Failed to Fill Crematory Site. ${response.error}`);
        button.textContent = `Failed: ${error}`;
        button.style.backgroundColor = '#fff';
        button.style.color = 'red';
        button.style.cursor = 'default';
        loadingText.style.display = 'none';
    }

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}



function GetClientAndPetDataFromPage() {
    //try {
    const data = {};

    // ---Get Client Info Section---
    const clientInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Client Info').parentElement.parentElement.parentElement;
    console.log("clientInfoSection:", clientInfoSection);

    // Get Client Name
    const clientName = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Name:').nextSibling;
    data.clientName = {
        //fullName: clientName.textContent.trim(),
        firstName: clientName.childNodes[0].textContent.trim(),
        lastName: clientName.childNodes[2].textContent.trim(),
    };
    data.clientName.fullName = `${data.clientName.firstName} ${data.clientName.lastName}`;
    console.log("clientName:", data.clientName);

    // phone number
    const clientNumber = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Phone (Primary):').nextSibling.firstChild;
    data.clientNumber = clientNumber.textContent.trim();
    console.log("clientNumber:", data.clientNumber);

    // email
    const clientEmail = Array.from(clientInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Email:').nextSibling;
    data.clientEmail = clientEmail.textContent.trim();
    console.log("clientEmail:", data.clientEmail);

    // ---Get Pet Info Section---
    const petInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Patients & Services').parentElement.parentElement.parentElement;
    console.log("petInfoSection:", petInfoSection);

    // Get Pet Name
    const petName = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Name:').parentElement.nextSibling.firstChild.firstChild;
    data.petName = petName.textContent.trim();
    console.log("petName:", petName);

    // species
    const petSpeciesInput = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Species:').parentElement.nextSibling;
    console.log("petSpeciesInput:", petSpeciesInput);
    const [petSpecies, petBreed] = separateSpeciesAndBreed(petSpeciesInput.textContent.trim())
    console.log("petSpecies:", petSpecies, "petBreed:", petBreed);
    data.petSpecies = petSpecies;
    data.petBreed = petBreed;
    //data.petSpecies = petSpecies.textContent.trim();

    // sex
    const petSex = Array.from(petInfoSection.querySelectorAll('strong')).find(strong => strong.textContent.trim() === 'Sex:').parentElement.nextSibling;
    data.petSex = petSex.textContent.trim();
    console.log("petSex:", petSex);

    // pronoun1 (handle in background)
    // pronoun2 (handle in background)

    // Get Appointment Info
    const appointmentInfoSection = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Appointment Info').parentElement.parentElement.parentElement;
    console.log("appointmentInfoSection:", appointmentInfoSection);
    const clientAddress = Array.from(appointmentInfoSection.querySelectorAll('p')).find(p => p.textContent.trim() === 'Address:').nextSibling.firstChild; // address
    console.log("clientAddress.innerText:", clientAddress.innerText);
    data.clientAddress = parseSingleOrMultiLineAddress(clientAddress.innerText);
    console.log("clientAddress Object:", data.clientAddress);
    //data.clientAddress = {
    //    line1: clientAddress.childNodes[0].textContent.trim(),
    //    line2: clientAddress.childNodes[2].textContent.trim(),
    //};
    //Object.assign(data.clientAddress, parseAddress(data.clientAddress.line1, data.clientAddress.line2));
    //Object.assign(data.clientAddress, parseSingleOrMultiLineAddress(clientAddress));
    parseSingleOrMultiLineAddress
    console.log("clientAddress:", data.clientAddress);

    //throw new Error("Function not ready yet"); // FOR TESTING
    return data;
    //} catch (error) {
        //alert(`Failed to gather client and pet data: ${error.message}`);
        // Optionally, log the error or return null/undefined
        //throw error;



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

/**
 * Separates a string into two parts: the text outside and inside any type of brackets.
 * Supports (), [], and {} brackets.
 * Example: "Species [Breed]" => ["Species", "Breed"]
 * @param {string} input - The combined string (e.g., "Species [Breed]")
 * @returns {[string, string]} - An array with [outsideText, insideText], trimmed. If no brackets, returns [input, ""]
 */
function separateSpeciesAndBreed(input) {
    const match = input.match(/^(.*?)\s*[\[\(\{](.*?)[\]\)\}]\s*$/);
    if (match) {
        return [match[1].trim(), match[2].trim()];
    }
    return [input.trim(), ""];
}

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


/**
 * Accept a single-line or multi-line address and return { raw, street, unit, city, state, zip, line1, line2, line3 }.
 * Handles:
 *  - "Street\nCity, State ZIP"
 *  - "Street\nUnit\nCity, State ZIP"
 *  - Single-line variants
 */
function parseSingleOrMultiLineAddress(input) {
    const raw = (input || '').replace(/\r/g, '').trim();
    if (!raw) return { raw, street: '', unit: '', city: '', state: '', zip: '', line1: '', line2: '', line3: '' };

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    // If only one line, reuse parseFullAddress
    if (lines.length === 1) {
        const r = parseFullAddress(lines[0]);
        // build lines according to US mailing conventions:
        // line1 = street (primary)
        // line2 = unit (if present)
        // line3 = "City, ST ZIP"
        const line3 = [r.city || '', r.state ? r.state.toUpperCase() : '', r.zip || ''].filter(Boolean).join(' ').replace(/\s+/g, ' ');
        return Object.assign(r, {
            line1: r.street || '',
            line2: r.unit || '',
            line3: line3 ? `${r.city}${r.city && r.state ? ', ' : (r.city && !r.state ? ', ' : '')}${r.state ? r.state.toUpperCase() : ''}${r.zip ? (r.state ? ' ' : ' ') + r.zip : ''}`.trim() : ''
        });
    }

    // Last line should contain city/state/zip
    const cityStateZip = lines[lines.length - 1];
    let streetLines = lines.slice(0, lines.length - 1);

    // Detect a standalone unit line (e.g. "6B", "#4", "Apt 3", "Suite 2")
    const unitOnlyRegex = /^(?:#\s*\d+[A-Za-z0-9\-\/]*|\d+[A-Za-z0-9\-\/]*|(?:Apt|Apartment|Unit|Ste|Suite|Fl|Floor|Rm|Room|Bldg)\b[\s#\.:-]*.*)$/i;
    let detectedUnit = '';
    if (streetLines.length > 1 && unitOnlyRegex.test(streetLines[streetLines.length - 1])) {
        detectedUnit = streetLines.pop();
    }

    const street = streetLines.join(' ').replace(/\s+/g, ' ').trim();

    // Build a single-line address for the main parser (do not inject detectedUnit as its own comma segment)
    const singleLine = `${street}${detectedUnit ? ' ' + detectedUnit : ''}, ${cityStateZip}`;

    const result = parseFullAddress(singleLine);

    // If parseFullAddress didn't pick up the unit (common for unit-only tokens like "6B"), apply detectedUnit
    if (!result.unit && detectedUnit) {
        // If the parser left the unit appended to the street, remove it
        const normalizedStreet = result.street || '';
        const trailing = (' ' + detectedUnit).trim();
        if (normalizedStreet.toLowerCase().endsWith(trailing.toLowerCase())) {
            result.street = normalizedStreet.slice(0, normalizedStreet.length - trailing.length).trim();
        }
        result.unit = detectedUnit;
    }

    // Build mailing lines: line1 = primary street, line2 = unit (if present), line3 = "City, ST ZIP"
    const stateAbbr = result.state || '';
    const line3 = [result.city || '', stateAbbr ? stateAbbr.toUpperCase() : '', result.zip || ''].filter(Boolean).join(' ').replace(/\s+/g, ' ');
    const formattedLine3 = result.city ? `${result.city}${result.city && stateAbbr ? ', ' : (result.city && !stateAbbr ? ', ' : '')}${stateAbbr ? stateAbbr.toUpperCase() : ''}${result.zip ? (stateAbbr ? ' ' : ' ') + result.zip : ''}`.trim() : line3;

    result.raw = raw;
    result.line1 = result.street || '';
    result.line2 = result.unit || '';
    result.line3 = formattedLine3 || '';

    return result;
}

/**
 * Parse a single-line US address into street, unit (apt/suite/#), city, state (abbr), zip and add line1/line2/line3.
 * - Handles PO Box, unit markers (Apt, Suite, #, Unit, Ste, Fl, etc.)
 * - Accepts formats with commas or without:
 *   "123 Main St Apt 4B, Springfield, IL 62704"
 *   "123 Main St, Apt #4B, Springfield IL 62704"
 *   "PO Box 123, Los Angeles CA 90012-1234"
 * Returns { street, unit, city, state, zip, raw, line1, line2, line3 }
 */
function parseFullAddress(singleLine) {
    const STATES = {
        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
        CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
        IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
        ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
        MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
        NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
        NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
        PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
        TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
        WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
    };
    const STATE_NAMES_TO_ABBR = Object.fromEntries(
        Object.entries(STATES).map(([k, v]) => [v.toLowerCase(), k])
    );
    const ABBRS = Object.keys(STATES).join('|');
    const NAMES_ESCAPED = Object.values(STATES)
        .map(n => n.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\s+/g, '\\s+'))
        .join('|');
    const STATE_GROUP = `(?:${ABBRS}|${NAMES_ESCAPED})`;

    const raw = (singleLine || '').trim();
    if (!raw) return { raw, street: '', unit: '', city: '', state: '', zip: '', line1: '', line2: '', line3: '' };

    // Normalize whitespace and commas
    let s = raw.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();

    // Extract ZIP (5 or 9)
    let zip = '';
    const zipMatch = s.match(/(\d{5}(?:-\d{4})?)$/);
    if (zipMatch) {
        zip = zipMatch[1];
        s = s.slice(0, zipMatch.index).replace(/,\s*$/, '').trim();
    }

    // Split on commas if present (prefer last two segments as city/state)
    const parts = s.split(',').map(p => p.trim()).filter(Boolean);
    let street = '';
    let city = '';
    let state = '';

    function normalizeState(input) {
        if (!input) return '';
        const t = input.trim();
        if (/^[A-Za-z]{2}$/.test(t)) {
            const uc = t.toUpperCase();
            return STATES[uc] ? uc : '';
        }
        const key = t.toLowerCase();
        return STATE_NAMES_TO_ABBR[key] || '';
    }

    if (parts.length >= 3) {
        // e.g. "Street, Neighborhood (ignored), City, State"
        street = parts.slice(0, parts.length - 2).join(', ');
        city = parts[parts.length - 2];
        state = normalizeState(parts[parts.length - 1]) || parts[parts.length - 1];
    } else if (parts.length === 2) {
        // parts[0] = street, parts[1] = "City State" or "City,State" already split
        street = parts[0];
        const cityState = parts[1];
        // try "City STATE" where STATE matches known
        const re = new RegExp(`^(.+?)\\s+(${STATE_GROUP})$`, 'i');
        const m = cityState.match(re);
        if (m) {
            city = m[1].trim();
            state = normalizeState(m[2]) || m[2];
        } else {
            // fallback: try split by last space
            const idx = cityState.lastIndexOf(' ');
            if (idx > 0) {
                city = cityState.slice(0, idx).trim();
                state = normalizeState(cityState.slice(idx + 1)) || cityState.slice(idx + 1);
            } else {
                city = cityState;
                state = '';
            }
        }
    } else {
        // no commas: attempt to extract "Street City State"
        // Try match: "Street,? City STATE" without commas using STATE_GROUP at end
        const re2 = new RegExp(`^(.+?)\\s+(.+?)\\s+(${STATE_GROUP})$`, 'i');
        const m2 = s.match(re2);
        if (m2) {
            street = m2[1].trim();
            city = m2[2].trim();
            state = normalizeState(m2[3]) || m2[3];
        } else {
            // last resort: treat everything up to last two tokens as street, last token as state, year as city unknown
            const tokens = s.split(' ');
            if (tokens.length >= 3) {
                state = normalizeState(tokens.slice(-1)[0]) || tokens.slice(-1)[0];
                city = tokens.slice(-2, -1)[0] || '';
                street = tokens.slice(0, -2).join(' ');
            } else if (tokens.length === 2) {
                street = tokens[0];
                city = tokens[1];
                state = '';
            } else {
                street = s;
            }
        }
    }

    // Extract unit from street (Apt, Apartment, Unit, Ste, Suite, #, Fl, Floor, Rm, Room)
    let unit = '';
    // common unit markers - capture the marker + value; search for the last occurrence
    const unitRegex = /\b(?:Apt|Apartment|Unit|Ste|Suite|#|Fl|Floor|Rm|Room|Bldg)\b\.?\s*[:#-]?\s*([^\.,;]+)$/i;
    const unitMatch = street.match(unitRegex);
    if (unitMatch) {
        unit = unitMatch[0].replace(/^[,;\s]+/, '').trim();
        // remove unit fragment from street
        street = street.slice(0, street.length - unitMatch[0].length).replace(/[,;\s]+$/, '').trim();
    } else {
        // also handle inline "#123" without word boundary at end
        const hashMatch = street.match(/(?:\s|,|^)(#\s*\d+[A-Za-z0-9\-\/]*)$/);
        if (hashMatch) {
            unit = hashMatch[1].trim();
            street = street.slice(0, street.length - hashMatch[1].length).trim().replace(/[,;\s]+$/, '');
        }
    }

    // Handle PO Box as street
    const poMatch = street.match(/^(P\.?\s*O\.?\s*Box|PO Box|Post Office Box)\s*#?\s*(\d+)/i);
    if (poMatch) {
        street = `${poMatch[1]} ${poMatch[2]}`;
    }

    // Final trims
    street = (street || '').trim();
    unit = (unit || '').trim();
    city = (city || '').trim();
    state = (state || '').trim();

    // Normalize state to abbreviation if possible
    const normState = normalizeState(state);
    if (normState) state = normState;

    // Build USPS mailing lines:
    // line1 = primary street (street)
    // line2 = secondary/unit (unit) — empty if none
    // line3 = "City, ST ZIP"
    const stateAbbr = state ? state.toUpperCase() : '';
    const line3 = [city || '', stateAbbr || '', zip || ''].filter(Boolean).join(' ').replace(/\s+/g, ' ');
    const formattedLine3 = city ? `${city}${city && stateAbbr ? ', ' : (city && !stateAbbr ? ', ' : '')}${stateAbbr}${zip ? (stateAbbr ? ' ' : ' ') + zip : ''}`.trim() : line3;

    return {
        raw,
        street,
        unit,
        city,
        state: stateAbbr,
        zip,
        line1: street || '',
        line2: unit || '',
        line3: formattedLine3 || ''
    };
}

