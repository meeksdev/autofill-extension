function createJotformLinkButton(){const t=document.querySelector("div.UXzdrb");console.log(t);const e=document.querySelector("div.gyRY9e");console.log(e);const o=document.createElement("button");o.textContent="Copy Jotform Link",o.style.marginTop="10px",o.style.marginRight="10px",o.style.backgroundColor="#4CAF50",o.style.color="white",o.style.padding="10px 20px",o.style.border="none",o.style.borderRadius="4px",o.style.cursor="pointer",e.before(o),console.log(o),chrome.storage.local.get(["jotformFormId"],(function(t){const e=t.jotformFormId;o.addEventListener("click",(async()=>{const t=`${document.getElementById("xStDaIn").value} ${convertTo24Hour(document.getElementById("xStTiIn").value)}`,n=new Date(t);let r,a;n.getHours()>12?(r=n.getHours()-12,a="PM"):(r=n.getHours(),a="AM");const i=n.getMinutes().toString().padStart(2,"0"),c=`?dateOf6%5Bmonth%5D=${n.getMonth()+1}&dateOf6%5Bday%5D=${n.getDate()}&dateOf6%5Byear%5D=${n.getFullYear()}&dateOf6%5BtimeInput%5D=${r}:${i}&dateOf6%5Bampm%5D=${a}`;navigator.clipboard.writeText(`https://form.jotform.com/${e}${c}`),o.textContent="Copied!",await delay(2e3),o.textContent="Copy Jotform Link"}))}))}function delay(t){return new Promise((e=>setTimeout(e,t)))}function convertTo24Hour(t){let[e,o]=t.split(/(am|pm)/i),[n,r]=e.split(":").map(Number);"pm"===o.toLowerCase()&&12!==n&&(n+=12),"am"===o.toLowerCase()&&12===n&&(n=0);return`${String(n).padStart(2,"0")}:${String(r).padStart(2,"0")}`}chrome.runtime.onMessage.addListener(((t,e,o)=>{if("createJotformLinkButton"===t.action){const{type:e}=t;"NEW"===e&&createJotformLinkButton()}}));