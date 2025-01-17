// js for Plumfield Moms started on 2019-09-01//
//Tally form script//
window.TallyConfig = {
    "formId": "3x9X6v",
    "popup": {
      "autoClose": 5000,
      "open": {
        "trigger": "scroll",
        "scrollPercent": 50
      },
      "showOnce": true,
      "doNotShowAfterSubmit": true
    }
  };
//Lightbox script//
  const attachListenersToImages = () => {
    const images = document.querySelectorAll('.notion-image');
    images.forEach(image => {
        image.addEventListener('click', (e) => {
            const lightboxImage = document.querySelector('.lightbox-image');
            const lightboxWrapper = document.querySelector('.lightbox-wrapper');
            lightboxImage.setAttribute("src", e.target.src);

            // Ensure DOM updates are reflected
            requestAnimationFrame(() => {
                lightboxWrapper.style.display = 'flex';
                lightboxWrapper.classList.add('open');
            });
        });
    });
};

const initLightbox = () => {
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxWrapper = document.querySelector('.lightbox-wrapper');
    const closeLightbox = document.querySelector('.close-lightbox');

    attachListenersToImages();

    [lightboxWrapper, closeLightbox].forEach(button => {
        button.addEventListener('click', (e) => {
            if (lightboxWrapper.classList.contains('open')) {
                lightboxWrapper.style.display = 'none';
                lightboxWrapper.classList.remove('open');
                lightboxImage.setAttribute("src", '');
            }
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            lightboxWrapper.style.display = 'none';
            lightboxWrapper.classList.remove('open');
        }
    });
};

const observeNewImages = () => {
    const observerConfig = { childList: true, subtree: true };
    const observer = new MutationObserver(() => {
        attachListenersToImages();
    });

    observer.observe(document.body, observerConfig);
};

window.addEventListener('load', () => {
    setTimeout(() => {
        initLightbox();
        observeNewImages();
    }, 500);
});
//New Site Popover//
// Get the popover element
const popover = document.getElementById("mypopover");

// Function to check if the URL has the 'source=oldsite' parameter
function checkURLForParam(param, value) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) === value;
}

// Trigger the popover if the 'source' parameter equals 'oldsite'
if (checkURLForParam("source", "oldsite")) {
  if (popover && typeof popover.showPopover === "function") {
    popover.showPopover();
  } else {
    console.error("Popover is not supported or element not found.");
  }
}
//Google Analytics//
// Check for the 'source' parameter in the URL
const urlParams = new URLSearchParams(window.location.search);
const sourceParam = urlParams.get('source');

if (sourceParam) {
  gtag('event', 'source_param_detected', {
    source: sourceParam // Send the source parameter as an event property
  });
}