chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "printDoc") {
        // Wait for the document to fully load before printing
        window.onload = function () {
            console.log("Before printing");
            window.print();
            console.log("After printing");
            // deleteDocument(message.docId);
            chrome.runtime.sendMessage({
                action: "deleteDoc",
                docId: message.docId,
            });
            console.log("After delete");
        };

        // If the document is already fully loaded, print immediately
        if (document.readyState === "complete") {
            console.log("Before printing");
            window.print();
            console.log("After printing");
            // deleteDocument(message.docId);
            chrome.runtime.sendMessage({
                action: "deleteDoc",
                docId: message.docId,
            });
            console.log("After delete");
        }
    }
});
