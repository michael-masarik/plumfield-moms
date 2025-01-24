const popover = document.getElementById('comment-form-popover');
popover.setAttribute('data-page', window.location.href);
const inputField = document.getElementById('9891c758-b1f1-493e-ac9f-83520a178f78');
inputField.value = window.location.href;
document.getElementById('comment-form-popover').addEventListener('submit', function(event) {
    event.preventDefault();
    setTimeout(() => {
        popover.style.display = 'none';
    }, 2000);
});