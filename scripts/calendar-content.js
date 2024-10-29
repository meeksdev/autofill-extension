/**
 * Listens for messages from the Chrome runtime and performs actions based on the message type and action.
 * @param {Object} message - The message object received from the Chrome runtime.
 * @param {string} message.action - The action to be performed.
 * @param {string} message.type - The type of the message.
 */
chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'createJotformLinkButton') {
        const { type } = message;
        if (type === 'NEW') {
            createJotformLinkButton();
        }
    }
});

/**
 * Creates a button that copies a Jotform link with pre-filled date and time when clicked.
 * The button is inserted into the DOM before a specific element.
 */
function createJotformLinkButton() {
    const topBar = document.querySelector('div.UXzdrb');
    console.log(topBar);

    // Add waitForCondition function to these two elements
    const blankDiv = document.querySelector('div.gyRY9e');
    console.log(blankDiv);

    const linkButton = document.createElement('button');
    linkButton.textContent = 'Copy Jotform Link';
    linkButton.style.marginTop = '10px';
    linkButton.style.marginRight = '10px';
    linkButton.style.backgroundColor = '#4CAF50';
    linkButton.style.color = 'white';
    linkButton.style.padding = '10px 20px';
    linkButton.style.border = 'none';
    linkButton.style.borderRadius = '4px';
    linkButton.style.cursor = 'pointer';

    // topBar.appendChild(linkButton);
    blankDiv.before(linkButton);
    console.log(linkButton);

    chrome.storage.local.get(['jotformFormId'], function (result) {
        const formId = result.jotformFormId;

        // console.log(`Appointment Date: ${appointmentDate2}`);

        linkButton.addEventListener('click', async () => {
            // navigator.clipboard.clear();
            // navigator.clipboard.writeText("This is a test!");

            const calendarDay = document.getElementById('xStDaIn').value;
            const calendarTime = document.getElementById('xStTiIn').value;
            const appointmentDate = `${calendarDay} ${convertTo24Hour(calendarTime)}`;
            const date = new Date(appointmentDate);
            // const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
            let hours, ampm;
            if (date.getHours() > 12) {
                hours = date.getHours() - 12;
                ampm = 'PM';
            } else {
                hours = date.getHours();
                ampm = 'AM';
            }
            // const hours = hoursNumeric.toString().padStart
            const minutes = date.getMinutes().toString().padStart(2, '0');
            // console.log(`${hours}:${date.getMinutes().toString().padStart(2, "0")}`);

            const query = `?dateOf6%5Bmonth%5D=${
                date.getMonth() + 1
            }&dateOf6%5Bday%5D=${date.getDate()}&dateOf6%5Byear%5D=${date.getFullYear()}&dateOf6%5BtimeInput%5D=${hours}:${minutes}&dateOf6%5Bampm%5D=${ampm}`;

            /* const query = `?appointment%5Bmonth%5D=${
                date.getMonth() + 1
            }&appointment%5Bday%5D=${date.getDate()}&appointment%5Byear%5D=${date.getFullYear()}&appointment%5BtimeInput%5D=${date
                .getHours()
                .toString()
                .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}`;
            console.log(query); */

            navigator.clipboard.writeText(`https://form.jotform.com/${formId}${query}`);

            linkButton.textContent = 'Copied!';

            await delay(2000);

            linkButton.textContent = 'Copy Jotform Link';
        });
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

/**
 * Converts a 12-hour time string to a 24-hour time string.
 * @param {string} timeStr - The 12-hour time string (e.g., "2:30pm").
 * @returns {string} The 24-hour time string (e.g., "14:30").
 */
function convertTo24Hour(timeStr) {
    // Extract the hours, minutes, and period (AM/PM) from the input
    let [time, period] = timeStr.split(/(am|pm)/i); // Split by AM/PM, case-insensitive
    let [hours, minutes] = time.split(':').map(Number); // Split hours and minutes, convert to numbers

    // Convert hours to 24-hour format
    if (period.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
    }
    if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0; // Midnight case
    }

    // Pad the hours and minutes with leading zeroes if needed
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}
