console.log("vetsnap-content.js loaded");

// Prepare an event to notify the framework of the change
const inputEvent = new Event('input', { bubbles: true });


// Can I potentially use .closest() to reduce the fragility of my code?


/**
 * Listens for messages from the Chrome runtime and performs actions based on the message type and action.
 * @param {Object} message - The message object received from the Chrome runtime.
 * @param {string} message.type - The type of the message.
 * @param {string} message.action - The action to be performed.
 * @param {number} message.tabId - The ID of the tab where the action should be performed.
 */
chrome.runtime.onMessage.addListener(async (message)=> {
    const { type, action } = message;
    console.log(message);

    if (type === 'NEW' && action === 'addClientAndPatient') {
        console.log('Received addClientAndPatient message');
        try {
            await checkClientExists(message.tabId, message.data);
            console.log("Completed Client and Patient addition.");
            //sendResponse({ success: true });
            sendResponseToBackground({ success: true });
        } catch (error) {
            console.error("Failed Client and Patient addition.");
            sendResponseToBackground({ success: false, error: error.message });
            //sendResponse({ success: false, error: error.message });
        }
        //return true;
    }
});
function sendResponseToBackground(response) {
    chrome.runtime.sendMessage({ action: 'responseFromVetsnapContent', response: response });
}


/**
 * Initiates the process of adding a new client by searching for existing clients and patients and then handling the result accordingly.
 * @param {number} tabId - The ID of the tab where the new order should be started.
 */
async function checkClientExists(tabId, data) {
    console.log('checkClientExists with data:', data);

    const filterDropdownElement = document.getElementById("Filter Type").nextElementSibling.querySelector('input'); // get filter type dropdown
    filterDropdownElement.value = 'client-name'; // set filter type to patient name
    //filterInputElement.dispatchEvent(inputEvent);
    console.log(filterDropdownElement);

    const filterInputElement = Array.from(document.querySelectorAll("label")).find(label => label.textContent.trim() === "Search By Client Last Name").nextElementSibling.querySelector('input');
    filterInputElement.value = data.clientName.lastName; // set filter search input to client's last name
    filterInputElement.dispatchEvent(inputEvent);
    console.log(filterInputElement);

    // either press enter or get apply filters and click it
    const applyFiltersButton = Array.from(document.querySelectorAll("button"))
        .find(button => button.textContent.trim() === "Apply Filter");// get button with text content "Apply Filters"
    console.log(applyFiltersButton);
    applyFiltersButton.click(); // click apply filters button

    let clientCard = await checkClientExistsAndReturnTheirCard(data);
    if (clientCard) {
        console.log("clientCard was found", clientCard);
        const viewPatientsDropdown = Array.from(clientCard.querySelectorAll('button')).find(button => button.textContent.trim() === "View Patients");
        console.log("View Patients Dropdown: ", viewPatientsDropdown);
        if (viewPatientsDropdown)
            viewPatientsDropdown.click();
        const addPatientButton = Array.from(clientCard.querySelectorAll("button")).find(button => button.textContent.trim() === "Add Patient");
        console.log(addPatientButton);

        await addPatient(addPatientButton, data);
    }
    else {
        console.log("Client not found, adding new client");
        await addNewClient(data);

        clientCard = await checkClientExistsAndReturnTheirCard(data);
        if (!clientCard) {
            alert("An error occurred finding this client.");

            return;
        }

        console.log("Client Card:", clientCard);
        const viewPatientsDropdown = Array.from(clientCard.querySelectorAll('button')).find(button => button.textContent.trim() === "View Patients");
        console.log("View Patients Dropdown: ", viewPatientsDropdown);
        if (viewPatientsDropdown)
            viewPatientsDropdown.click();
        const addPatientButton = Array.from(clientCard.querySelectorAll("button")).find(button => button.textContent.trim() === "Add Patient");
        console.log(addPatientButton);

        await addPatient(addPatientButton, data);
    }
}

async function checkClientExistsAndReturnTheirCard(data) {
    console.log("checkClientExistsAndReturnTheirCard", data);

    // if no results, click Create New Client button
    // if results, click first result
    // perhaps I simply use the edit client button or view patients dropdown to determine if the client exists
    // compare the client's full name and address to the one in the appointment
    // wait for results to load


    const result = await waitForCondition(() => {
        const clientHeaders = Array.from(document.querySelectorAll("p")).filter(p => p.textContent.includes("Client Full Name"));
        if (clientHeaders.length > 0) {
            return { found: "client", elements: clientHeaders };
        }
        const noClients = Array.from(document.querySelectorAll("div")).find(div => div.textContent.includes("No Clients Found"));
        if (noClients) {
            return { found: "none", element: noClients };
        }
        return false; // keep waiting
    });


    if (result.found === "none") {
        console.log("Client Not Found...");
        return false;
    } else {
        const clientHeadersList = result.elements;
        console.log("Client Headers List:", clientHeadersList);
        for (const headerElement of clientHeadersList) {
            const clientFullName = await waitForCondition(() => headerElement.nextElementSibling.textContent.trim());
            console.log("Client Full Name: '" + clientFullName + "'; Searching for: '" + data.clientName.fullName + "'");
            // if the client full name matches the appointment's client full name, break and run addPatient()
            if (clientFullName === data.clientName.fullName) {
                console.log("Found Client. Getting Client Card...");
                const clientCard = await waitForCondition(() => headerElement.parentElement.parentElement.parentElement.parentElement.parentElement); // navigate to the client card
                return clientCard;
            }
        };
    }
}

async function addNewClient(data) {
    console.log("Adding new client");

    // get the Create New Client Button
    const createNewClientButton = await waitForCondition(() => Array.from(document.querySelectorAll("button")).find(button => button.textContent.trim() === "Create New Client"));
    createNewClientButton.click(); // click the button
    console.log("Create New Client Button: ", createNewClientButton);

    // get the modal window that appears
    const modalWindow = await waitForCondition(() => Array.from(document.querySelectorAll("h6")).find(header => header.textContent.trim() === "Create A New Client").parentElement.parentElement);
    console.log("Modal Window: ", modalWindow);

    // enter client information
    // enter Client First Name
    const firstNameInput = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client First Name").nextElementSibling.querySelector("input"));
    firstNameInput.value = data.clientName.firstName;
    firstNameInput.dispatchEvent(inputEvent);
    console.log("First Name Input: ", firstNameInput);

    // enter Client Last Name
    const lastNameInput = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client Last Name").nextElementSibling.querySelector("input"));
    lastNameInput.value = data.clientName.lastName;
    lastNameInput.dispatchEvent(inputEvent);
    console.log("Last Name Input: ", lastNameInput);

    // enter Client Address Line 1
    const addressLine1Input = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client Address 1").nextElementSibling.querySelector("input"));
    addressLine1Input.value = data.clientAddress.street;
    addressLine1Input.dispatchEvent(inputEvent);
    console.log("Address Line 1 Input: ", addressLine1Input);

    // enter Client Address Line 2
    const addressLine2Input = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client Address 2").nextElementSibling.querySelector("input"));
    addressLine2Input.value = data.clientAddress.unit;
    addressLine2Input.dispatchEvent(inputEvent);
    console.log("Address Line 2 Input: ", addressLine2Input);

    // enter Client City
    const clientCityInput = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client City").nextElementSibling.querySelector("input"));
    clientCityInput.value = data.clientAddress.city;
    clientCityInput.dispatchEvent(inputEvent);
    console.log("City Input: ", clientCityInput);

    // enter Client State
    const clientStateInput = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client State").nextElementSibling.querySelector("input"));
    clientStateInput.value = data.clientAddress.state;
    clientStateInput.dispatchEvent(inputEvent);
    console.log("State Input: ", clientStateInput);

    // enter Client Zip Code
    const clientZipCodeInput = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Client Zip Code").nextElementSibling.querySelector("input"));
    clientZipCodeInput.value = data.clientAddress.zip;
    clientZipCodeInput.dispatchEvent(inputEvent);
    console.log("Zip Code Input: ", clientZipCodeInput);

    // click the create button
    const finalCreateButton = await waitForCondition(() => Array.from(modalWindow.querySelectorAll("button")).find(button => button.textContent.trim() === "Create"));
    console.log("Create Button: ", finalCreateButton);
    finalCreateButton.click();
}


// FOUND A BUG WHERE NO CLIENT WOULD BE SELECTED AND CODE WOULD HANG (JUSTIN MANNING)
async function addPatient(addPatientButton, data) {
    console.log("Adding patient to client using button:", addPatientButton);
    await delay(2000); // wait for dropdown animation to finish
    console.log("Completed delay");
    addPatientButton.click();

    // wait for modal to appear
    const modalWindow = await waitForCondition(() => Array.from(document.querySelectorAll("div")).find(div => div.textContent.includes("Add A Patient To Client"))); // get the modal that appears
    console.log("Modal Window: ", modalWindow);

    // click create new patient
    const createNewPatientButton = Array.from(modalWindow.querySelectorAll("button")).find(button => button.textContent.trim() === "Create New Patient");
    console.log("Create New Patient Button:", createNewPatientButton);
    createNewPatientButton.click();

    //await waitForCondition(() => Array.from(modalWindow.querySelectorAll()) );

    // enter patient information
    // THIS IS THE WAY I SHOULD REALLY BE HANDLING EVERYTHING
    const patientNameInput = await waitForCondition(() => {
        const el = Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Patient Name").parentElement.querySelector("input");
        if (!el) return false;

        if (el.value !== data.petName) {
            el.value = data.petName;
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // return element once the condition is satisfied
        return el.value === data.petName ? el : false;
    });
    console.log("Patient Name:", patientNameInput);

    const speciesInput = await waitForCondition(() => {
        const el = Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Species").parentElement.querySelector("input");
        if (!el) return false;

        if (el.value !== data.petSpecies) {
            el.value = data.petSpecies;
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // return element once the condition is satisfied
        return el.value === data.petSpecies ? el : false;
    });
    console.log("Species:", speciesInput);

    const breedInput = Array.from(modalWindow.querySelectorAll("label")).find(label => label.textContent.trim() === "Breed").parentElement.querySelector("input");
    breedInput.value = data.petBreed; // set breed
    breedInput.dispatchEvent(inputEvent); // dispatch input event to trigger any listeners
    console.log("Breed:", breedInput);

    // click create & add
    const createAndAddButton = Array.from(modalWindow.querySelectorAll("button")).find(button => button.textContent.trim() === "Create & Add");
    console.log("Create & Add Button:", createAndAddButton);
}




/**
* Waits for a condition to be met within a specified time frame.
* @param {function(): boolean} checkCondition - A function that checks the condition to be met.
* @param {number} [intervalTime=100] - The interval time in milliseconds to check the condition.
* @param {number} [maxWaitTime=60000] - The maximum wait time in milliseconds before rejecting the promise.
* @returns {Promise<*>} A promise that resolves with the result of the condition function if met within the max wait time, otherwise rejects.
*/
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

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}