chrome.runtime.onMessage.addListener((message, sender, response) => {
    console.log('Listener added');
    if (message.action === 'fillCrematoryForm') {
        console.log('Message received');
        const { type } = message;
    
        if(type === "NEW") {
            // Set up the interval to run every second
            const intervalId = setInterval(() => {
                const form = document.forms[0];
                if (form) {
                    // console.log(form);
                    clearInterval(intervalId); // Stop the loop when the condition is met
                    fillCrematoryForm(form);
                }
            }, 100);

            
        }
    } 
});



function fillCrematoryForm(form) {
    console.log(`Fill Crematory Form`);
    console.log(form);

    // Loop through each input element in the form and log its name
    /* console.log(form.elements.length);
    for (let i = 0; i < form.elements.length; i++) {
        const element = form.elements[i];
        if (element.tagName.toLowerCase() === 'input') { // Ensure it's an input element
            console.log(element);
        }
    } */

    // Prepare an event to notify the framework of the change
    const event = new Event('input', { bubbles: true });

    const speciesInput = document.getElementById('typeahead-basic');
    speciesInput.value = 'Dog';
    const birthdateInput = document.querySelector('input[placeholder="Date of Birth (yyyy-mm-dd)"]');
    birthdateInput.value = '2024-05-25';
    const passingDateInput = document.querySelector('input[placeholder="Date of Passing (yyyy-mm-dd)"]');
    passingDateInput.value = '2024-08-27';
    
    const unitOfMeasureInput = document.querySelector('input[formcontrolname="unitOfMeasure"]');
    if (1) {    //will have to update this condition with the saved value instead of input value
        const lbsButton = unitOfMeasureInput.nextElementSibling.lastChild;
        lbsButton.click();
    } else if (0) {
        const kgButton = unitOfMeasureInput.nextElementSibling.firstChild;
        kgButton.click();
    }

    const genderInput = document.querySelector('input[formcontrolname="gender"]');
    if (1) {    //will have to update this condition with the saved value instead of input value
        const maleButton = genderInput.nextElementSibling.firstChild;
        maleButton.click();
    } else if (0) {
        const femaleButton = genderInput.nextElementSibling.lastChild;
        femaleButton.click();
    }

    form['name'].value = 'Scooby';
    form['name'].dispatchEvent(event);
    form['description'].value = 'Golden Retriever';
    form['inputtedWeight'].value = "10";
    form['inputtedWeight'].dispatchEvent(event);
    form['firstName'].value = 'Logan';
    form['lastName'].value = 'Meeks';
    form['lastName'].dispatchEvent(event);
    form['emailAddress'].value = '21loganmeeks@gmail.com';
    form['phoneNumber'].value = '702-521-7541';
    form['address1'].value = 'Autofill Test';
    form['address2'].value = 'Autofill Test';

    const submitButton = document.querySelector('button.btn.btn-primary.ms-2');
    console.log(submitButton);
    submitButton.disabled = false;
};

