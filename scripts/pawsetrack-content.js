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
// const urnKeys = [];
// const memorialKeys = [];

chrome.runtime.onMessage.addListener((message, sender, response) => {
  console.log("Listener added");
  const { type, action } = message;
  if (type === "NEW") {
    if (action === "fillPetAndOwnerForm") {
      // Set up the interval to run every second
      const intervalId = setInterval(() => {
        const form = document.forms[0];
        if (form) {
          clearInterval(intervalId); // Stop the loop when the condition is met
          getStoredData(petAndOwnerKeys, (storage) => {
            fillPetAndOwnerForm(form, storage);
          });
        }
      }, 100);
    } else if (action === "selectUrn") {
      getStoredData(["urnChoice"], (storage) => {
        selectUrn(storage);
      });
    }
  }
});

function getStoredData(keys, callback) {
  chrome.storage.local.get(keys, function (result) {
    keys.forEach((key) => {
      if (!result[key] && key !== "clientAddress2") {
        console.log(`${key} Does not exist: ${result[key]}`);
      }
    });

    callback(result);
  });
}

function fillPetAndOwnerForm(form, storage) {
  console.log(`Fill Crematory Form`);
  console.log(form);
  console.log(storage);

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
  const { unitOfMeasure, weightValue } = separateValueAndUnits(storage.weight);
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
  const genderInput = document.querySelector('input[formcontrolname="gender"]');
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

  const submitButton = document.querySelector("button.btn.btn-primary.ms-2");
  console.log(submitButton);
  submitButton.disabled = false;

  createModalWindow();
}

function selectUrn(storage) {
  const intervalId = setInterval(() => {
    const urnButton = [...document.querySelectorAll("div[role=button]")].find(
      (div) =>
        div.querySelector(".item-name")?.textContent.includes(storage.urnChoice)
    );
    if (urnButton) {
      console.log(urnButton);
      clearInterval(intervalId); // Stop the loop when the condition is met
      urnButton.click();

      // Additional
    }
  }, 100);
}

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
