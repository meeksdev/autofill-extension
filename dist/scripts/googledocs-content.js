chrome.runtime.onMessage.addListener(((e,o,n)=>{"printDoc"===e.action&&(window.onload=function(){window.print(),console.log("After printing"),chrome.runtime.sendMessage({action:"deleteDoc",docId:e.docId}),console.log("After delete")},"complete"===document.readyState&&(window.print(),console.log("After printing"),chrome.runtime.sendMessage({action:"deleteDoc",docId:e.docId}),console.log("After delete")))}));