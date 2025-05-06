
// Show a temporary "Copied Link!" toast
function showCopiedNotice() {
  const notice = document.createElement('div');
  notice.textContent = 'Copied Link!';
  notice.style.position = 'fixed';
  notice.style.bottom = '1.5rem';
  notice.style.left = '50%';
  notice.style.transform = 'translateX(-50%)';
  notice.style.background = '#7D0E0E';
  notice.style.color = '#fff';
  notice.style.padding = '0.5rem 1rem';
  notice.style.borderRadius = '8px';
  notice.style.fontSize = '1rem';
  notice.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  notice.style.zIndex = 9999;
  notice.style.opacity = 0;
  notice.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(notice);
  requestAnimationFrame(() => {
    notice.style.opacity = 1;
  });

  setTimeout(() => {
    notice.style.opacity = 0;
    setTimeout(() => {
      notice.remove();
    }, 300);
  }, 1500);
}

// Fallback method for copying text to clipboard
function fallbackCopy(url) {
  const textarea = document.createElement('textarea');
  textarea.value = url;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopiedNotice();
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textarea);
}

// Attempt to copy the current URL to clipboard
function copy() {
  const url = window.location.href;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => {
        showCopiedNotice();
      })
      .catch(err => {
        console.error('Clipboard API failed, using fallback.', err);
        fallbackCopy(url);
      });
  } else {
    fallbackCopy(url);
  }
}

// Show a one-time shortcut tip notice in PWA mode
function showShortcutNotice() {
  const notice = document.createElement('div');
  notice.textContent = 'Tip: Press Cmd+L (Mac) / Ctrl+L (Android) to copy the page link!';
  notice.style.position = 'fixed';
  notice.style.bottom = '1.5rem';
  notice.style.left = '50%';
  notice.style.transform = 'translateX(-50%)';
  notice.style.background = '#7D0E0E';
  notice.style.color = '#fff';
  notice.style.padding = '0.5rem 1rem';
  notice.style.borderRadius = '8px';
  notice.style.fontSize = '1rem';
  notice.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  notice.style.zIndex = 9999;
  notice.style.opacity = 0;
  notice.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(notice);
  requestAnimationFrame(() => {
    notice.style.opacity = 1;
  });

  setTimeout(() => {
    notice.style.opacity = 0;
    setTimeout(() => {
      notice.remove();
    }, 300);
  }, 4000);
}

// Share dialog using Web Share API
const shareData = {
url: window.location.href,
title: document.getElementsByClassName("notion-header__title")[0]?.textContent || "Check this out!",
};

const share = document.getElementById("copy");

if (share && navigator.share) {
share.addEventListener("click", async () => {
  try {
    await navigator.share(shareData);
  } catch (err) {
    console.error("Share failed:", err);
  }
});
}
// Advanced search redirection on search element click
// document.addEventListener('click', function(e) {
// const searchEl = e.target.closest('.super-navbar__search');
// const isSearchButton = e.target.closest('#search');

// if (searchEl || isSearchButton) {
//   const currentURL = encodeURIComponent(window.location.href);
//   e.preventDefault();
//   window.location.href = `https://code.plumfieldmoms.com/search/?url=${currentURL}`;
// }
// });
// Show the shortcut notice only once in PWA mode
if (window.matchMedia('(display-mode: standalone)').matches) {
if (!localStorage.getItem('shortcutNoticeShown')) {
  showShortcutNotice();
  localStorage.setItem('shortcutNoticeShown', 'true');
}
}
// Keyboard shortcut: Cmd+L or Ctrl+L to copy the link
document.addEventListener('keydown', function(e) {
let isMac = false;

if (navigator.userAgentData) {
  isMac = navigator.userAgentData.platform === 'macOS';
} else {
  isMac = navigator.userAgent.toUpperCase().includes('MAC');
}

const isCmdL = (isMac && e.metaKey && e.key.toLowerCase() === 'l') ||
               (!isMac && e.ctrlKey && e.key.toLowerCase() === 'l');

if (isCmdL) {
  e.preventDefault();
  copy();
}
});

// Remove Tally popup for form 3x9X6v in PWA mode
function removeTallyPopupInPWA() {
if (window.matchMedia('(display-mode: standalone)').matches) {
  const isTargetedPopup = (cfg) => (
    cfg &&
    cfg.formId === "3x9X6v" &&
    cfg.popup &&
    cfg.popup.autoClose === 1000 &&
    cfg.popup.doNotShowAfterSubmit === true &&
    cfg.popup.showOnce === true
  );

  const removeIfMatched = () => {
    if (isTargetedPopup(window.TallyConfig)) {
      delete window.TallyConfig;
      console.log("Tally popup for form 3x9X6v was removed in PWA mode.");
    }
  };

  removeIfMatched();
  setTimeout(removeIfMatched, 100);
  setTimeout(removeIfMatched, 500);
}
}

removeTallyPopupInPWA();