chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'printDoc') {
        // Wait for the document to fully load before printing
        window.onload = function() {
            console.log('Before printing');
            window.print();
            console.log('After printing');
            // deleteDocument(message.docId);
            chrome.runtime.sendMessage({ action: 'deleteDoc', docId: message.docId });
            console.log('After delete');
        };

        // If the document is already fully loaded, print immediately
        if (document.readyState === 'complete') {
            console.log('Before printing');
            window.print();
            console.log('After printing');
            // deleteDocument(message.docId);
            chrome.runtime.sendMessage({ action: 'deleteDoc', docId: message.docId });
            console.log('After delete');
        }
    }
});


/* function deleteDocument(docId) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('Document deleted successfully');
            } else {
                console.error('Failed to delete document');
            }
        })
        .catch(error => {
            console.error('Error deleting document:', error);
        });
    });
} */