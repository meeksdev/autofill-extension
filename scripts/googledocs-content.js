chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'printDoc') {
        // Wait for the document to fully load before printing
        window.onload = function() {
            window.print();
        };

        // If the document is already fully loaded, print immediately
        if (document.readyState === 'complete') {
            window.print();
        }
    }
});
