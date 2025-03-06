document.addEventListener("DOMContentLoaded", function () {
    // Initialize Quill
    const quill = new Quill("#editor", {
        theme: "snow",
        modules: {
            toolbar: [["bold", "italic", "underline"], ["link"]],
        },
    });

    const form = document.getElementById("review-form");
    const hiddenInput = document.getElementById("hiddenInput");
    const authorSearch = document.getElementById("authorSearch");
    const authorList = document.getElementById("authorList");
    const selectedAuthorId = document.getElementById("selectedAuthorId");
    const messageDiv = document.getElementById("message");

    // Fetch authors from Notion
    async function fetchAuthors(query) {
        if (query.length < 2) return;
        authorList.innerHTML = ""; // Clear previous results

        const response = await fetch(`https://plumfield-moms.onrender.com/authors?search=${query}`);
        const authors = await response.json();

        authors.forEach(author => {
            const div = document.createElement("div");
            div.textContent = author.name;
            div.onclick = function () {
                authorSearch.value = author.name;
                selectedAuthorId.value = author.id; // Store Notion ID
                authorList.innerHTML = ""; // Clear dropdown
            };
            authorList.appendChild(div);
        });
    }

    authorSearch.addEventListener("input", () => fetchAuthors(authorSearch.value));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        hiddenInput.value = quill.root.innerHTML;

        const formData = {
            title: document.getElementById("title").value,
            richTextContent: hiddenInput.value,
            authorId: selectedAuthorId.value,
            reviewType: document.getElementById("reviewType").value, // Gets selected database
        };

        // Determine the API endpoint based on the review type
        let endpoint;
        switch (formData.reviewType) {
            case "bookReview":
                endpoint = "https://plumfield-moms.onrender.com/submit/book-review";
                break;
            case "pictureBookReview":
                endpoint = "https://plumfield-moms.onrender.com/submit/picture-book";
                break;
            case "reflection":
                endpoint = "https://plumfield-moms.onrender.com/submit/reflection";
                break;
            default:
                messageDiv.innerHTML = "<p>❌ Error: Invalid review type.</p>";
                return;
        }

        // Send data to the correct database
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            form.style.display = "none";
            messageDiv.innerHTML = "<p>✅ Review submitted successfully!</p>";
        } else {
            messageDiv.innerHTML = "<p>❌ Error submitting review. Please try again.</p>";
        }
    });
});