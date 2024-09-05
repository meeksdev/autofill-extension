const petAndOwnerKeys = [
    "petName",
    "species",
    "breed",
    "weight",
    "birthDate",
    "passingDate",
    "sex",
    "clientFirstName",
    "clientLastName",
    "clientEmail",
    "clientPhone",
    "clientAddress1",
    "clientAddress2",
];
// const bundlesKeys = [];
const urnKeys = [
    "urnChoice",
    "isUrnEngraved",
    "urnLine1",
    "urnLine2",
    "urnLine3",
    "urnLine4",
];
// const memorialKeys = [];

chrome.runtime.onMessage.addListener((message, sender, response) => {
    const { type, action } = message;
    if (type === "NEW") {
        if (action === "fillPetAndOwnerForm") {
            // Set up the interval to run every second
            let iterationCount = 0;
            const intervalId = setInterval(() => {
                const form = document.forms[0];
                if (form) {
                    getStoredData(petAndOwnerKeys, (storage) => {
                        fillPetAndOwnerForm(form, storage);
                    });
                }
            }, 100);
        } else if (action === "fillBundlesForm") {
        } else if (action === "selectUrn") {
            getStoredData(urnKeys, (storage) => {
                selectUrn(storage);
            });
        } else if (action === "fillMemorialForm") {
        } else if (action === "fillReviewForm") {
        }
    }
});

function getStoredData(keys, callback) {
    chrome.storage.local.get(keys, function (result) {
        keys.forEach((key) => {
            if (!result[key] && key !== "clientAddress2") {
                console.warn(`${key} Does not exist: ${result[key]}`);
            }
        });

        callback(result);
    });
}

/*** PET AND OWNER PAGE ***/
function fillPetAndOwnerForm(form, storage) {
    // Loop through each input element in the form and log its name
    /* console.log(form.elements.length);
for (let i = 0; i < form.elements.length; i++) {
    const element = form.elements[i];
    if (element.tagName.toLowerCase() === 'input') { // Ensure it's an input element
        console.log(element);
    }
} */

    // Prepare an event to notify the framework of the change
    const event = new Event("input", { bubbles: true });

    // Species
    const speciesInput = document.getElementById("typeahead-basic");
    speciesInput.value = storage.species;

    // Birth and Passing Dates
    if (storage.birthdate) {
        const birthdateInput = document.querySelector(
            'input[placeholder="Date of Birth (yyyy-mm-dd)"]'
        );
        birthdateInput.value = storage.birthdate;
    }
    const passingDateInput = document.querySelector(
        'input[placeholder="Date of Passing (yyyy-mm-dd)"]'
    );
    passingDateInput.value = storage.passingDate.split(" ")[0];

    // Unit of Weight Measurement
    const { unitOfMeasure, weightValue } = separateValueAndUnits(
        storage.weight
    );
    const unitOfMeasureInput = document.querySelector(
        'input[formcontrolname="unitOfMeasure"]'
    );
    if (unitOfMeasure === "lb" || unitOfMeasure === "lbs") {
        const lbsButton = unitOfMeasureInput.nextElementSibling.lastChild;
        lbsButton.click();
    } else if (unitOfMeasure === "kg" || unitOfMeasure === "kgs") {
        const kgButton = unitOfMeasureInput.nextElementSibling.firstChild;
        kgButton.click();
    }

    // Gender or Sex
    const genderInput = document.querySelector(
        'input[formcontrolname="gender"]'
    );
    if (storage.sex === "Male") {
        const maleButton = genderInput.nextElementSibling.firstChild;
        maleButton.click();
    } else if (storage.sex === "Female") {
        const femaleButton = genderInput.nextElementSibling.lastChild;
        femaleButton.click();
    }

    // Other form fields
    form["name"].value = storage.petName;
    form["name"].dispatchEvent(event);
    form["description"].value = storage.breed;
    form["inputtedWeight"].value = weightValue;
    form["inputtedWeight"].dispatchEvent(event);
    form["firstName"].value = storage.clientFirstName;
    form["lastName"].value = storage.clientLastName;
    form["lastName"].dispatchEvent(event);
    form["emailAddress"].value = storage.clientEmail;
    form["phoneNumber"].value = storage.clientPhone;
    form["address1"].value = storage.clientAddress1;
    form["address2"].value = storage.clientAddress2;

    //go to the next page
    const nextPageButton = document.querySelector(
        "button.btn.btn-primary.ms-2"
    );
    nextPageButton.click();

    // createModalWindow();
}

/*** BUNDLED PRODUCTS PAGE ***/
function fillBundlesForm(form, storage) {
    //go to the next page
    const nextPageButton = document.querySelector(
        "button.btn.btn-primary.ms-2"
    );
    nextPageButton.click();
}

/*** URN PAGE ***/
function selectUrn(storage) {
    console.log("selectUrn");
    waitForCondition(
        () => {
            const urnButton = [
                ...document.querySelectorAll("div[role=button]"),
            ].find((div) =>
                div
                    .querySelector(".item-name")
                    ?.textContent.includes(storage.urnChoice)
            );
            return urnButton;
        },
        (urnButton) => {
            urnButton.click();

            // if (storage.urnChoice === "Serenity Photo Standard Urn") {
            // }

            waitForCondition(
                () => document.querySelector("div[class=modal-content]"),
                (urnWindow) => {
                    console.log(urnWindow);

                    /* // Hand-Carved, Serenity, Remembrance Standard, Both Decorative Metal Urns,
                    if (storage.urnChoice === "Serenity Photo Standard Urn") {
                        // check if line 1 and line 2 are not blank, and if so change the values in the form.
                        if (
                            storage.urnLine1 !== "" ||
                            storage.urnLine2 !== ""
                        ) {
                        }
                    } else if (
                        storage.urnChoice === "Cedar Memorial Standard Urn"
                    )  */
                    // {
                    const query = storage.isUrnEngraved
                        ? "div.product-offering-item.my-3"
                        : "div.product-offering-item.my-3.active";
                    waitForCondition(
                        () => urnWindow.querySelector(query),
                        (engravedStyleButton) => {
                            console.log(engravedStyleButton);
                            engravedStyleButton.click();

                            console.log(
                                storage.urnLine1,
                                storage.urnLine2,
                                storage.urnLine3,
                                storage.urnLine4
                            );

                            // check if line 1 and line 2 are not blank, and if so change the values in the form.
                            if (
                                storage.urnLine1 !== "" ||
                                storage.urnLine2 !== "" ||
                                storage.urnLine3 !== "" ||
                                storage.urnLine4 !== ""
                            ) {
                                const line1 = urnWindow.querySelector(
                                    "input[placeholder='Line 1']"
                                );
                                if (line1) line1.value = storage.urnLine1;

                                const line2 = urnWindow.querySelector(
                                    "input[placeholder='Line 2']"
                                );
                                if (line2) line2.value = storage.urnLine2;

                                if (storage.isUrnEngraved) {
                                    const line3 = urnWindow.querySelector(
                                        "input[placeholder='Line 3']"
                                    );
                                    if (line3) line3.value = storage.urnLine3;

                                    const line4 = urnWindow.querySelector(
                                        "input[placeholder='Line 4']"
                                    );
                                    if (line4) line4.value = storage.urnLine4;
                                }
                            }

                            const addUrnButton = urnWindow.querySelector(
                                "button.btn.btn-primary"
                            );
                            console.log(addUrnButton);
                            // addUrnButton.click();
                        }
                    );
                    // }

                    // Do nothing for Scattering tube, Satin
                }
            );
        }
    );
}

/*** MEMORIAL PRODUCTS PAGE ***/
function fillMemorialForm(form, storage) {
    //go to the next page
    const nextPageButton = document.querySelector(
        "button.btn.btn-primary.ms-2"
    );
    nextPageButton.click();
}

/*** REVIEW SUMMARY PAGE ***/
function fillReviewSummaryPage(form, storage) {}

function createModalWindow() {
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
    modal.style.padding = "10px 30px";
    modal.style.maxWidth = "400px";
    modal.style.borderRadius = "5px";

    // Add a close button to the modal
    const closeButton = document.createElement("div");
    closeButton.innerHTML = "X";
    closeButton.style.position = "absolute";
    closeButton.style.fontSize = "20px";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.cursor = "pointer";

    const notificationText = document.createElement("p");
    notificationText.innerHTML =
        "<br><p>Form autofilled with last gathered Jotform Data.</p>";

    modal.appendChild(closeButton);
    modal.appendChild(notificationText);
    document.body.appendChild(modal);

    // Add an event listener to the close button to hide the modal
    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

function separateValueAndUnits(input) {
    const match = input.match(/(\d+\.?\d*)([a-zA-Z]+)/);

    if (match) {
        return {
            weightValue: parseFloat(match[1]), // The numeric value
            unitOfMeasure: match[2], // The unit
        };
    } else {
        // Handle cases where the input does not match the expected pattern
        return {
            weightValue: null,
            unitOfMeasure: null,
        };
    }
}

function waitForCondition(
    checkCondition,
    onSuccess,
    intervalTime = 100,
    maxWaitTime = 60000
) {
    const startTime = Date.now();

    const intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const result = checkCondition(); // Store the result of the condition check

        // If condition is met, stop the interval and pass the result to the success action
        if (result) {
            clearInterval(intervalId);
            onSuccess(result); // Pass the found element to onSuccess
        }

        // If maximum wait time has been exceeded, stop the interval
        if (elapsedTime >= maxWaitTime) {
            clearInterval(intervalId);
            console.warn("Max wait time exceeded.");
        }
    }, intervalTime);
}
