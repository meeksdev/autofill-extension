chrome.runtime.onMessage.addListener((message, sender, response) => {
    console.log("Listener added");
    if (message.action === "createFormButton") {
        console.log("Message received");
        const { type } = message;

        if (type === "NEW") {
            createFormButtonModal();
        }
    }
});

function createFormButtonModal() {
    // Check if modal already exists
    const existingAutofillModal = document.getElementById("AutofillModal");
    if (existingAutofillModal) {
        console.log("Modal already exists. Check if it is hidden");
        existingAutofillModal.style.display = "flex";
        return; // Don't create a new modal if one already exists
    }

    // Create modal/popup element
    const modal = document.createElement("div");
    modal.id = "AutofillModal";
    modal.style.backgroundColor = "#fff";
    modal.style.position = "fixed";
    modal.style.top = "50px";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, 0)";
    modal.style.zIndex = "99999";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "10px";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
    modal.style.padding = "10px 20px";
    modal.style.maxWidth = "400px";
    modal.style.borderRadius = "5px";

    // Create description Text
    const step1Text = document.createElement("p");
    step1Text.innerHTML = "Gather the data from the form submission.";

    // Create the gather button element
    const gatherButton = document.createElement("button");
    gatherButton.textContent = "Fetch JotForm Data";
    gatherButton.style.backgroundColor = "#4285f4";
    gatherButton.style.color = "#fff";
    gatherButton.style.borderRadius = "5px";
    gatherButton.style.cursor = "pointer";
    gatherButton.style.padding = "10px 20px";

    // Add a close button to the modal
    const closeButton = document.createElement("div");
    closeButton.innerHTML = "X";
    closeButton.style.position = "absolute";
    closeButton.style.fontSize = "20px";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.cursor = "pointer";

    const loadingText = document.createElement("p");
    loadingText.innerHTML = "Loading... Please wait...";
    loadingText.style.display = "none";

    modal.appendChild(closeButton);
    modal.appendChild(step1Text);
    modal.appendChild(gatherButton);
    modal.appendChild(loadingText);

    // Append the button to the body of the webpage
    document.body.appendChild(modal);
    console.log("Button created and appended to the body");

    // Add an event listener to the button
    gatherButton.addEventListener("click", () => {
        console.log("Gather Button clicked");
        gatherButton.style.backgroundColor = "#b8cff5";
        gatherButton.style.cursor = "progress";
        gatherButton.disabled = true;
        loadingText.style.display = "block";

        // Extract the form ID from the URL
        const urlPath = window.location.pathname;
        const submissionId = urlPath.split("/").pop(); // Gets the last part of the URL path
        console.log("Submission ID from URL:", submissionId);

        // Send a message to the background script to fetch data from JotForm
        chrome.runtime.sendMessage(
            { action: "getJotFormSubmissionData", submissionId: submissionId },
            function (response) {
                if (response.success) {
                    console.log("Form Submission:", response.data);
                    modal.style.display = "none";

                    window.open(
                        `https://mail.google.com/mail/u/0/#drafts/${response.draftId}`,
                        "_blank"
                    );
                    printGoogleDoc(response.docId);
                } else {
                    console.error(
                        "Failed to fetch JotForm data:",
                        response.error
                    );
                    alert(
                        "Failed to fetch submission data. Check the console for errors."
                    );
                }
            }
        );
    });

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

function printGoogleDoc(docId) {
    chrome.runtime.sendMessage({ action: "openAndPrintDoc", docId: docId });
}

function printCurrentWindow() {
    window.print();
}
