// js for Plumfield Moms started on 2019-09-01//
//New Site Alert//

// Function to check if the URL has the 'source=oldsite' parameter
function checkURLForParam(param, value) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) === value;
}

// Wait until the entire page has loaded
window.onload = function () {
  if (checkURLForParam("source", "oldsite")) {
    alert("Plumfield and Paideia has now become Plumfield Moms. Welcome to our new site!");
  }
};
//Google Analytics//
// Check for the 'source' parameter in the URL
const urlParams = new URLSearchParams(window.location.search);
const sourceParam = urlParams.get('source');

if (sourceParam) {
  gtag('event', 'source_param_detected', {
    source: sourceParam // Send the source parameter as an event property
  });
}
//Popover fallback on old devices//

if (!HTMLDivElement.prototype.showPopover) {
  console.log("Popover API not supported on this device/browser.");
  document.querySelectorAll('[popover]').style.display = 'none'; // Hides the popover
} else {
  console.log("Popover API is supported!");
}


