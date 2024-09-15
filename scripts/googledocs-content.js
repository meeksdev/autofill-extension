const inputEvent = new Event('input', { bubbles: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'printDoc') {
        // Wait for the document to fully load before printing
        window.onload = function () {
            printAndDelete();
        };

        // If the document is already fully loaded, print immediately
        if (document.readyState === 'complete') {
            printAndDelete();
        }
    }
});

async function printAndDelete() {
    // window.document.close();
    // window.focus();
    // const canvas = document.getElementsByClassName('kix-appview-editor')[0];
    // console.log(canvas);
    // canvas.click();
    // canvas.dispatchEvent(inputEvent);

    // window.print();
    chrome.runtime.sendMessage({
        action: 'deleteDoc',
        docId: message.docId,
    });
    // createFormButtonModal();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForCondition(checkCondition, intervalTime = 100, maxWaitTime = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const intervalId = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const result = checkCondition();

            if (result) {
                clearInterval(intervalId);
                resolve(result);
            }

            if (elapsedTime >= maxWaitTime) {
                clearInterval(intervalId);
                reject('Max wait time exceeded.');
            }
        }, intervalTime);
    });
}

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

    // Create the docsAndEmailButton element
    const printButton = document.createElement('button');
    printButton.textContent = 'Fill Docs and Email';
    printButton.style.backgroundColor = '#4285f4';
    printButton.style.color = '#fff';
    printButton.style.borderRadius = '5px';
    printButton.style.cursor = 'pointer';
    printButton.style.padding = '10px 20px';
    printButton.id = 'AutofillModal-GatherButton';

    // Add a close button to the modal
    const closeButton = document.createElement('div');
    closeButton.innerHTML = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.fontSize = '20px';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.cursor = 'pointer';

    modal.appendChild(closeButton);
    modal.appendChild(printButton);

    // Append the button to the body of the webpage
    document.body.appendChild(modal);

    // Add an event listener to the button
    printButton.addEventListener('click', () => {
        window.print();
    });

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}
