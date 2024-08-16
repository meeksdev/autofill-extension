
// console.log('Currently on a submission page!');


// Wait for the document to fully load
if(document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', createFormButtonModal);
} else {
    createFormButtonModal();
}

chrome.runtime.onMessage.addListener((message, sender, response) => {
    if (message.action === 'createFormButton') {
        console.log('Message received');
        const { type } = message;
    
        if(type === "NEW") {
            createFormButtonModal();
        }
    } 
    // else if (message.action === 'printWindow') {
    //     console.log('Printing window');
    //     printCurrentWindow();
    // }
});




function createFormButtonModal() {
    // Check if modal already exists
    const existingAutofillModal = document.getElementById('AutofillModal');
    if (existingAutofillModal) {
        console.log('Modal already exists. Check if it is hidden');
        existingAutofillModal.style.display = 'flex';
        return;  // Don't create a new modal if one already exists
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
    modal.style.maxWidth = '400px'
    modal.style.borderRadius = '5px';
    

    // Create description Text
    const step1Text = document.createElement('p');
    step1Text.innerHTML = 'Step 1. Gather the data from the form submission.';
    // Create the gather button element
    const gatherButton = document.createElement('button');
    gatherButton.textContent = 'Fetch JotForm Data';
    gatherButton.style.backgroundColor = '#4285f4';
    gatherButton.style.color = '#fff';
    // gatherButton.style.border = 'none';
    gatherButton.style.borderRadius = '5px';
    gatherButton.style.cursor = 'pointer';
    gatherButton.style.padding = '10px 20px';


    // Create description Text
    const step2Text = document.createElement('p');
    step2Text.innerHTML = 'Step 2. Print the sympathy card.';
    step2Text.style.display = 'none';
    // Create the print button element
    const printButton = document.createElement('button');
    printButton.textContent = 'Print Sympathy Card';
    printButton.style.backgroundColor = '#4285f4';
    printButton.style.color = '#fff';
    printButton.
    // printButton.style.border = 'none';
    printButton.style.borderRadius = '5px';
    printButton.style.cursor = 'pointer';
    printButton.style.padding = '10px 20px';
    printButton.style.display = 'none';

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

    modal.appendChild(closeButton);
    modal.appendChild(step1Text);
    modal.appendChild(gatherButton);
    modal.appendChild(loadingText);
    // modal.appendChild(step2Text);
    // modal.appendChild(printButton);

    // Append the button to the body of the webpage
    document.body.appendChild(modal);
    console.log('Button created and appended to the body');

    /* gatherButton.addEventListener('mousedown', function() {
        gatherButton.style.backgroundColor = '#295499';
    });

    gatherButton.addEventListener('mouseup', function() {
        gatherButton.style.backgroundColor = '#4285f4';
    }); */

    // Add an event listener to the button
    gatherButton.addEventListener('click', () => {
        console.log('Gather Button clicked');
        
        // Extract the form ID from the URL
        const urlPath = window.location.pathname;
        const submissionId = urlPath.split('/').pop(); // Gets the last part of the URL path
        console.log('Submission ID from URL:', submissionId);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage({ action: 'getJotFormSubmissionData', submissionId: submissionId }, function(response) {
            if (response.success) {
                console.log('Form Submission:', response.data);
                step1Text.style.color = 'lightgrey';
                step1Text.style.textDecoration = 'line-through';
                gatherButton.style.backgroundColor = '#b8cff5';
                step2Text.style.display = 'block';
                printButton.style.display = 'block';

                window.open(`https://mail.google.com/mail/u/0/#drafts/${response.draftId}`, '_blank');
                // window.open(`https://docs.google.com/document/d/${response.docId}/edit`, '_blank');
                printGoogleDoc(response.docId);
            } else {
                console.error('Failed to fetch JotForm data:', response.error);
                alert('Failed to fetch submission data. Check the console for errors.');
            }
        });
    });

    printButton.addEventListener('click', () => {
        console.log('Print button clicked');
        // printGoogleDoc(docId);
    });

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
};



// Function to open and print the Google Doc
/* function printGoogleDoc(docId) {
    // Open the Google Doc in a new window
    const printWindow = window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');

    // Wait for the document to fully load
    printWindow.onload = function() {
        // Trigger the print dialog
        printWindow.print();
    };
} */


/* function printGoogleDoc(docId) {
    // Open the Google Doc in a new window
    const printWindow = window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');

    // Check if the new window opened successfully
    if (printWindow) {
        // Set an interval to check if the document is fully loaded
        const checkWindowLoaded = setInterval(() => {
            if (printWindow.document.readyState === 'complete') {
                clearInterval(checkWindowLoaded); // Stop checking once the document is fully loaded

                // Focus on the window to make sure it's active
                printWindow.focus();

                // Trigger the print dialog
                console.log('Printing');
                printWindow.print();
            }
        }, 500); // Check every 500ms
    } else {
        console.error('Failed to open the new window. Please check your browser settings.');
    }
} */


function printGoogleDoc(docId) {
    // const docId = 'your-google-doc-id-here'; // Replace with the actual Google Doc ID
    chrome.runtime.sendMessage({ action: 'openAndPrintDoc', docId: docId });
}
    


function printCurrentWindow() {
    window.print();
}