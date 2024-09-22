chrome.runtime.onMessage.addListener((message, sender, response) => {
    if (message.action === 'createFormButton') {
        const { type } = message;
        if (type === 'NEW') {
            createFormButtonModal();
        }
    }
});

function createFormButtonModal() {
    // Check if modal already exists
    const existingAutofillModal = document.getElementById('AutofillModal');
    if (existingAutofillModal) {
        existingAutofillModal.style.display = 'flex';

        const gatherButton = document.getElementById('AutofillModal-GatherButton');
        gatherButton.style.backgroundColor = '#4285f4';
        gatherButton.style.cursor = 'pointer';
        gatherButton.disabled = false;

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
    step1Text.innerHTML = 'Gather the data from the form submission.';

    // Create the docsAndEmailButton element
    const docsAndEmailButton = document.createElement('button');
    docsAndEmailButton.textContent = 'Fill Docs and Email';
    docsAndEmailButton.style.backgroundColor = '#4285f4';
    docsAndEmailButton.style.color = '#fff';
    docsAndEmailButton.style.borderRadius = '5px';
    docsAndEmailButton.style.cursor = 'pointer';
    docsAndEmailButton.style.padding = '10px 20px';
    docsAndEmailButton.id = 'AutofillModal-GatherButton';

    // Create the crematoryButton element
    const crematoryButton = document.createElement('button');
    crematoryButton.textContent = 'Fill Crematory Forms';
    crematoryButton.style.backgroundColor = '#4285f4';
    crematoryButton.style.color = '#fff';
    crematoryButton.style.borderRadius = '5px';
    crematoryButton.style.cursor = 'pointer';
    crematoryButton.style.padding = '10px 20px';
    crematoryButton.id = 'AutofillModal-GatherButton';

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
    modal.appendChild(docsAndEmailButton);
    modal.appendChild(crematoryButton);
    modal.appendChild(loadingText);

    // Append the button to the body of the webpage
    document.body.appendChild(modal);

    // Add an event listener to the button
    docsAndEmailButton.addEventListener('click', () => {
        docsAndEmailButton.style.backgroundColor = '#b8cff5';
        docsAndEmailButton.style.cursor = 'progress';
        docsAndEmailButton.disabled = true;
        loadingText.style.display = 'block';

        // Extract the form ID from the URL
        const urlPath = window.location.pathname;
        const submissionId = urlPath.split('/').pop(); // Gets the last part of the URL path
        console.log('%cSubmission ID from URL:', 'color: green', submissionId);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'fillDocsAndEmail', submissionId: submissionId }, async function (response) {
            if (response.success) {
                console.log('%cForm Submission:', 'color: green', response.data);
                docsAndEmailButton.textContent = 'Completed.';
                docsAndEmailButton.style.backgroundColor = '#fff';
                docsAndEmailButton.style.color = 'green';
                docsAndEmailButton.style.cursor = 'default';
                loadingText.style.display = 'none';

                window.open(`https://mail.google.com/mail/u/0/#drafts/${response.draftId}`, '_blank');
                if (response.data.letterDocId) printGoogleDoc(response.data.letterDocId);
                if (response.data.envelopeDocId) printGoogleDoc(response.data.envelopeDocId);
                // if (response.data.invoiceDocId) printGoogleDoc(response.data.invoiceDocId);
                if (response.data.invoiceDocId) window.open(`https://docs.google.com/document/d/${response.data.invoiceDocId}/edit`, '_blank');
            } else {
                console.error('Failed to Fill Docs and Email:', response.error);
                // alert(`Failed to Fill Crematory Site. ${response.error}`);
                docsAndEmailButton.textContent = `Failed: ${response.error}`;
                docsAndEmailButton.style.backgroundColor = '#fff';
                docsAndEmailButton.style.color = 'red';
                docsAndEmailButton.style.cursor = 'default';
                loadingText.style.display = 'none';
            }
        });
    });

    crematoryButton.addEventListener('click', () => {
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
    });

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function printGoogleDoc(docId) {
    chrome.runtime.sendMessage({ action: 'openAndPrintDoc', docId: docId });
}

function printCurrentWindow() {
    window.print();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
