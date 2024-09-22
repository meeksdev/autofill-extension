// Prepare an event to notify the framework of the change
const inputEvent = new Event('input', { bubbles: true });

const pageCompletionKeys = [];

const petAndOwnerKeys = [
    'petName',
    'species',
    'breed',
    'weight',
    'birthDate',
    'passingDate',
    'sex',
    'clientFirstName',
    'clientLastName',
    'clientEmail',
    'clientPhone',
    'clientAddress1',
    'clientAddress2',
    'clientApartmentNumber',
];
const bundlesKeys = ['pawOrNosePrint', 'cremationType'];
const urnKeys = ['urnChoice', 'isUrnEngraved', 'urnLine1', 'urnLine2', 'urnLine3', 'urnLine4'];
const memorialKeys = [
    'pawOrNosePrint',
    'clayNosePrint',
    'clayPawPrint',
    'additionalBoxedFurClipping',
    'additionalFurClipping',
    'additionalNosePrint',
    'additionalPawPrint',
    'cremationType',
];
const reviewKeys = ['cremationType', 'pawOrNosePrint', 'collectionLocation', 'petHospital'];

chrome.runtime.onMessage.addListener(async (message, sender, response) => {
    const { type, action } = message;
    console.log(message);

    if (type === 'NEW') {
        if (action === 'startNewOrder') {
            startNewOrder(message.tabId);
        } else if (action === 'selectCremationType') {
            getStoredSessionData(['cremationType'], ({ cremationType }) => {
                selectCremationType(cremationType, message.tabId);
            });
        } else if (action === 'fillPetAndOwnerForm') {
            const form = await waitForCondition(() => document.forms[0]);
            getStoredSessionData(petAndOwnerKeys, storage => {
                fillPetAndOwnerForm(form, storage, message.tabId);
            });
        } else if (action === 'fillBundlesForm') {
            getStoredSessionData(bundlesKeys, storage => {
                fillBundlesForm(storage, message.tabId);
            });
        } else if (action === 'selectUrn') {
            getStoredSessionData(urnKeys, storage => {
                selectUrn(storage, message.tabId);
            });
        } else if (action === 'fillMemorialForm') {
            getStoredSessionData(memorialKeys, storage => {
                fillMemorialForm(storage, message.tabId);
            });
        } else if (action === 'fillReviewForm') {
            getStoredSessionData(reviewKeys, storage => {
                fillReviewForm(storage);
            });
        }
    }
});

function getStoredSessionData(keys, callback) {
    chrome.storage.local.get(keys, function (result) {
        keys.forEach(key => {
            if (!result[key] && key !== 'clientAddress2') {
                console.warn(`${key} Does not exist: ${result[key]}`);
            }
        });

        callback(result);
    });
}

/*** DASHBOARD PAGE ***/
async function startNewOrder(tabId) {
    console.log('startNewOrder');
    const newOrderButton = await waitForCondition(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('New Order')));
    console.log(newOrderButton);
    newOrderButton.click();

    chrome.runtime.sendMessage({ action: 'selectCremationType', tabId: tabId });
}

/*** START ORDER PAGE ***/
async function selectCremationType(cremationType, tabId) {
    console.log(cremationType);

    if (cremationType === 'Private') {
        const cremationButton = await waitForCondition(() =>
            [...document.querySelectorAll('div.service-selection')].find(div => div.firstChild.textContent.includes('Private Cremation'))
        );
        console.log(cremationButton);
        cremationButton.click();
    } else if (cremationType === 'Memorial') {
        const cremationButton = await waitForCondition(() =>
            [...document.querySelectorAll('div.service-selection')].find(div => div.firstChild.textContent.includes('Communal Cremation'))
        );
        console.log(cremationButton);
        cremationButton.click();
    }

    chrome.runtime.sendMessage({ action: 'fillPetAndOwnerForm', tabId: tabId });
}

/*** PET AND OWNER PAGE ***/
async function fillPetAndOwnerForm(form, storage, tabId) {
    const passingDateInput = document.querySelector('input[placeholder="Date of Passing (yyyy-mm-dd)"]');
    passingDateInput.value = storage.passingDate.split(' ')[0];
    passingDateInput.dispatchEvent(inputEvent);

    // Unit of Weight Measurement
    // const { unitOfMeasure, weightValue } = separateValueAndUnits(storage.weight);
    const unitOfMeasureInput = document.querySelector('input[formcontrolname="unitOfMeasure"]');
    const lbsButton = unitOfMeasureInput.nextElementSibling.lastChild;
    lbsButton.click();

    // Gender or Sex
    // const genderInput = document.querySelector('input[formcontrolname="gender"]');
    let genderQuery;
    if (storage.sex === 'Male') {
        genderQuery = 'Male';
    } else if (storage.sex === 'Female') {
        genderQuery = 'Female';
    } else {
        genderQuery = 'Unspecified';
    }
    const genderButton = [...document.querySelectorAll('button')].find(button => button.textContent === genderQuery);
    console.log(genderButton);
    genderButton.click();

    // Other form fields
    form['name'].value = storage.petName;
    form['name'].dispatchEvent(inputEvent);
    form['description'].value = storage.breed;
    form['description'].dispatchEvent(inputEvent);
    form['inputtedWeight'].value = storage.weight;
    form['inputtedWeight'].dispatchEvent(inputEvent);
    form['firstName'].value = storage.clientFirstName;
    form['firstName'].dispatchEvent(inputEvent);
    form['lastName'].value = storage.clientLastName;
    form['lastName'].dispatchEvent(inputEvent);
    form['emailAddress'].value = storage.clientEmail;
    form['emailAddress'].dispatchEvent(inputEvent);
    form['phoneNumber'].value = storage.clientPhone;
    form['phoneNumber'].dispatchEvent(inputEvent);
    form['address2'].value = storage.clientApartmentNumber;
    form['address2'].dispatchEvent(inputEvent);

    // Species
    const speciesInput = document.getElementById('typeahead-basic');
    speciesInput.dispatchEvent(inputEvent);
    const speciesDropdown = await waitForCondition(() => speciesInput.nextElementSibling);
    console.log(speciesDropdown);
    const speciesDropdownButton = await waitForCondition(() =>
        [...speciesDropdown.querySelectorAll('*')].find(element => element.textContent.includes(storage.species))
    );
    speciesDropdownButton.click();
    await waitForCondition(() => !speciesDropdown.isConnected);

    const addressInput = form['address1'];
    console.log(addressInput);
    addressInput.value = `${storage.clientAddress1}, ${storage.clientAddress2}`;
    addressInput.dispatchEvent(new Event('focus'));
    addressInput.dispatchEvent(new Event('input'));
    await delay(500);
    const keyboardEvent = new KeyboardEvent('keydown', { keyCode: 40 }); // Down arrow key
    addressInput.dispatchEvent(keyboardEvent);
    addressInput.dispatchEvent(new Event('blur'));

    //go to the next page
    const nextPageButton = await waitForCondition(() => document.querySelector('button.btn.btn-primary.ms-2'));
    await waitForCondition(() => nextPageButton.disabled === false);
    nextPageButton.click();

    // createModalWindow();

    chrome.runtime.sendMessage({ action: 'fillBundlesForm', tabId: tabId });
}

/*** BUNDLED PRODUCTS PAGE ***/
async function fillBundlesForm(storage, tabId) {
    console.log(storage.pawOrNosePrint);

    if (storage.pawOrNosePrint === 'Nose print') {
        const removeButton = await waitForCondition(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Remove')));
        console.log(removeButton);
        removeButton.click();
    } else if (storage.pawOrNosePrint === 'Paw print') {
        // Here we simply have to wait to see that the product is actually being added. If we skip this, we start to see bugs.
        await waitForCondition(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Remove')));
    } else if (storage.pawOrNosePrint === 'No thank you') {
        const removeButton = await waitForCondition(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Remove')));
        console.log(removeButton);
        removeButton.click();
    }

    //go to the next page
    const nextPageButton = document.querySelector('button.btn.btn-primary.ms-2');
    nextPageButton.click();

    if (storage.cremationType === 'Private') chrome.runtime.sendMessage({ action: 'selectUrn', tabId: tabId });
    if (storage.cremationType === 'Memorial') chrome.runtime.sendMessage({ action: 'fillMemorialForm', tabId: tabId });
}

/*** URN PAGE ***/
async function selectUrn(storage, tabId) {
    console.log('selectUrn');

    const urnButton = await waitForCondition(() =>
        [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes(storage.urnChoice))
    );
    urnButton.click();

    const urnWindow = await waitForCondition(() => document.querySelector('div[class=modal-content]'));

    if (storage.urnChoice.includes('Decorative Metal Standard Urn')) {
        if (storage.urnLine1 || storage.urnLine2) {
            const personalizeItemButton = await waitForCondition(() => {
                const personalizeItemForm = [...urnWindow.querySelectorAll('span')]
                    .find(span => span.textContent.includes('Personalize this item?'))
                    ?.closest('form'); // Get the closest form that contains the span
                const personalizeItemButton = [...personalizeItemForm.querySelectorAll('button')].find(button => button.textContent.includes('Yes'));
                return personalizeItemButton;
            });
            personalizeItemButton.click();
        }
    }

    const query = storage.isUrnEngraved ? 'div.product-offering-item.my-3' : 'div.product-offering-item.my-3.active';
    await waitForCondition(() => urnWindow.querySelector(query), 100, 250)
        .then(engravedStyleButton => engravedStyleButton.click())
        .catch(error => console.warn('Error:', error));

    handleUrnText(storage, urnWindow);
    await delay(250);

    const productNotification = urnWindow.querySelector("input[formcontrolname='confirmWarning']");
    console.log(productNotification);
    if (productNotification) productNotification.click();

    const addUrnButton = await waitForCondition(() => urnWindow.querySelector('button.btn.btn-primary'));
    console.log(addUrnButton);
    addUrnButton.click();

    await waitForCondition(() => !urnWindow.isConnected);

    //go to the next page
    const nextPageButton = document.querySelector('button.btn.btn-primary.ms-2');
    nextPageButton.click();

    chrome.runtime.sendMessage({ action: 'fillMemorialForm', tabId: tabId });
}

async function handleUrnText(storage, urnWindow) {
    console.log(storage.urnLine1, storage.urnLine2, storage.urnLine3, storage.urnLine4);

    // check if line 1 and line 2 are not blank, and if so change the values in the form.
    if (storage.urnLine1 !== '' || storage.urnLine2 !== '' || storage.urnLine3 !== '' || storage.urnLine4 !== '') {
        const line1 = await waitForCondition(() => urnWindow.querySelector("input[placeholder='Line 1']"));
        if (line1) {
            line1.value = storage.urnLine1;
            line1.dispatchEvent(inputEvent);
        }

        const line2 = await waitForCondition(() => urnWindow.querySelector("input[placeholder='Line 2']"));
        if (line2) {
            line2.value = storage.urnLine2;
            line2.dispatchEvent(inputEvent);
        }

        if (storage.isUrnEngraved) {
            const line3 = await waitForCondition(() => urnWindow.querySelector("input[placeholder='Line 3']"));
            if (line3) {
                line3.value = storage.urnLine3;
                line3.dispatchEvent(inputEvent);
            }

            const line4 = await waitForCondition(() => urnWindow.querySelector("input[placeholder='Line 4']"));
            if (line4) {
                line4.value = storage.urnLine4;
                line4.dispatchEvent(inputEvent);
            }
        }
    }
}

/*** MEMORIAL PRODUCTS PAGE ***/
async function fillMemorialForm(storage, tabId) {
    // COMMUNAL CREMATION FIX
    /* if (storage.cremationType === "Memorial" && storage.pawOrNosePrint === "Paw print") {
        storage.additionalPawPrint = storage.additionalPawPrint ? storage.additionalPawPrint++ : 1;
    }
    console.log("cremationType:", storage.cremationType);
    console.log("pawOrNosePrint:", storage.pawOrNosePrint);
    console.log("additionalPawPrint:", storage.additionalPawPrint); */

    // BUNDLED PRODUCTS NOSE PRINT
    if (storage.pawOrNosePrint === 'Nose print') {
        storage.additionalNosePrint = storage.additionalNosePrint ? storage.additionalNosePrint++ : 1;
    }

    // CLAY PAW PRINT
    for (let i = 0; i < storage.clayPawPrint; i++) {
        console.log('Add Clay Paw Print');

        const specialServiceButton = await waitForCondition(() => {
            return [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes('Clay Paw Print'));
        });
        specialServiceButton.click();

        const modal = await waitForCondition(() => document.querySelector("div[class='modal-content']"));

        const personalizeItemButton = await waitForCondition(() => [...modal.querySelectorAll('button')].find(button => button.textContent.includes('Yes')));
        personalizeItemButton.click();

        const addButton = await waitForCondition(() => {
            return [...document.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent.includes('Add'));
        });
        await waitForCondition(() => addButton.disabled === false);
        addButton.click();

        await waitForCondition(() => !modal.isConnected);
    }

    // CLAY NOSE PRINT
    for (let i = 0; i < storage.clayNosePrint; i++) {
        console.log('Add Clay Nose Print');

        const specialServiceButton = await waitForCondition(() => {
            return [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes('Clay Paw Print'));
        });
        specialServiceButton.click();

        const modal = await waitForCondition(() => document.querySelector("div[class='modal-content']"));

        const personalizeItemButton = await waitForCondition(() => [...modal.querySelectorAll('button')].find(button => button.textContent.includes('Yes')));
        personalizeItemButton.click();

        const specialInstructions = await waitForCondition(() => document.getElementById('specialInstructions'));
        specialInstructions.value = 'CLAY NOSE PRINT';
        specialInstructions.dispatchEvent(inputEvent);

        const addButton = await waitForCondition(() => {
            return [...document.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent.includes('Add'));
        });
        await waitForCondition(() => addButton.disabled === false);
        addButton.click();

        await waitForCondition(() => !modal.isConnected);
    }

    // ADDITIONAL BOXED FUR CLIPPING
    for (let i = 0; i < storage.additionalBoxedFurClipping; i++) {
        console.log('Add Boxed Fur Clipping');
        // What do we do here since its supposed to be boxed??
    }

    // ADDITIONAL FUR CLIPPING
    for (let i = 0; i < storage.additionalFurClipping; i++) {
        console.log('Add Fur Clipping');

        const specialServiceButton = await waitForCondition(() => {
            return [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes('Fur Clipping'));
        });
        specialServiceButton.click();

        const modal = await waitForCondition(() => document.querySelector("div[class='modal-content']"));

        const addButton = await waitForCondition(() => {
            return [...document.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent.includes('Add'));
        });
        await waitForCondition(() => addButton.disabled === false);
        addButton.click();

        await waitForCondition(() => !modal.isConnected);
    }

    // ADDITIONAL NOSE PRINT
    for (let i = 0; i < storage.additionalNosePrint; i++) {
        console.log('Add Nose Print');

        const specialServiceButton = await waitForCondition(() => {
            return [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes('Ink Nose Print'));
        });
        specialServiceButton.click();

        const modal = await waitForCondition(() => document.querySelector("div[class='modal-content']"));

        const addButton = await waitForCondition(() => {
            return [...document.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent.includes('Add'));
        });
        await waitForCondition(() => addButton.disabled === false);
        addButton.click();

        await waitForCondition(() => !modal.isConnected);
    }

    // ADDITIONAL PAW PRINT
    for (let i = 0; i < storage.additionalPawPrint; i++) {
        console.log('Add Paw Print');

        const specialServiceButton = await waitForCondition(() => {
            return [...document.querySelectorAll('div[role=button]')].find(div => div.querySelector('.item-name')?.textContent.includes('Ink Paw Print'));
        });
        specialServiceButton.click();

        const modal = await waitForCondition(() => document.querySelector("div[class='modal-content']"));

        const addButton = await waitForCondition(() => {
            return [...document.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent.includes('Add'));
        });
        await waitForCondition(() => addButton.disabled === false);
        addButton.click();

        await waitForCondition(() => !modal.isConnected);
    }

    //go to the next page
    const nextPageButton = document.querySelector('button.btn.btn-primary.ms-2');
    nextPageButton.click();

    chrome.runtime.sendMessage({ action: 'fillReviewForm', tabId: tabId });
}

/*** REVIEW SUMMARY PAGE ***/
async function fillReviewForm(storage) {
    console.log('fillReviewForm');
    console.log(storage.collectionLocation);

    let extraElements = [];
    if (storage.collectionLocation === 'Office' || (storage.cremationType === 'Memorial' && storage.pawOrNosePrint !== 'No thank you')) {
        // Do Nothing
        const unorderedList = document.createElement('ul');
        const listElement = document.createElement('li');
        listElement.textContent = `Add Collection Location: ${storage.petHospital}`;

        unorderedList.appendChild(listElement);
        extraElements.push(unorderedList);
    } else if (storage.collectionLocation === 'Pick-up') {
        const deliveryButton = await waitForCondition(() =>
            [...document.querySelectorAll('button')].find(button => button.textContent.includes('Pickup From Care Center'))
        );
        console.log(deliveryButton);
        deliveryButton.click();
    } else if (storage.collectionLocation === 'Mailed') {
        // Click Other and enter "Mail ashes to Owner's home address"
        const deliveryButton = await waitForCondition(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Other')));
        console.log(deliveryButton);
        deliveryButton.click();

        const specialInstructionsField = await waitForCondition(() => document.getElementById('specialInstructions'));
        specialInstructionsField.value = "Mail ashes to Owner's home address";
    } else if (storage.collectionLocation === 'Sarena') {
        // Do Nothing
    }

    console.log(extraElements);
    if (extraElements.length > 0) createModalWindow(extraElements);
    else createModalWindow();
}

function createModalWindow(extraElements = null) {
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
    modal.style.padding = '10px 30px';
    modal.style.maxWidth = '400px';
    modal.style.borderRadius = '5px';

    // Add a close button to the modal
    const closeButton = document.createElement('div');
    closeButton.innerHTML = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.fontSize = '20px';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.cursor = 'pointer';

    const notificationText = document.createElement('p');
    notificationText.innerHTML = '<br><p>Form autofilled with last gathered Jotform Data.</p>';

    modal.appendChild(closeButton);
    modal.appendChild(notificationText);
    document.body.appendChild(modal);

    console.log(extraElements);
    if (extraElements) {
        extraElements.forEach(element => {
            modal.appendChild(element);
        });
    }

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
