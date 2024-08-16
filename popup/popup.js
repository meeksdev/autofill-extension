// console.log("This is a popup!");


// 1. Gather info from Jotform or Google Forms

// 2. Open a new window or tab with a new gmail draft and enter the correct message to the hospital

// 3. Open a new window or tab with a google doc to be printed

// 4. Potentially autofill data to a google sheet or Sarena's new drug log site.


console.log("This is a popup!");
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: 'printWindow' });
});