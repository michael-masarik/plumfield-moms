import parseHTML from "./notion-block-format.js";
document.addEventListener("DOMContentLoaded", function () {
    // Initialize Quill
    const quill = new Quill("#editor", {
        theme: "snow",
        modules: {
            toolbar: [["link"]],
        },
    });

    const form = document.getElementById("review-form");
    const selectedAuthorId = document.getElementById("selectedAuthorId");
    const messageDiv = document.getElementById("message");
    const authorDropdown = document.getElementById("authorSelect");

    let allAuthors = [];

    // Load authors from the API and populate dropdown
    async function loadAuthors() {
        try {
            const response = await fetch("https://plumfield-moms.onrender.com/authors");
            allAuthors = await response.json();
            populateAuthorDropdown();
        } catch (error) {
            console.error("Error loading authors:", error);
            messageDiv.innerHTML = "<p>❌ Error loading authors. Please try again.</p>";
        }
    }

    function populateAuthorDropdown() {
        if (!authorDropdown) {
            console.error("Dropdown not found!");
            return;
        }

        authorDropdown.innerHTML = '<option value="">Select an author...</option>'; // Default option

        allAuthors.forEach(author => {
            const option = document.createElement("option");
            option.value = author.id; // Store Notion ID
            option.textContent = author.name;
            authorDropdown.appendChild(option);
        });
    }

    if (authorDropdown) {
        authorDropdown.addEventListener("change", function () {
            selectedAuthorId.value = this.value;
        });
    }

    loadAuthors();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const richTextContent = quill.root.innerHTML; // Get Quill HTML
        const formattedBlocks = parseHTML(richTextContent); // Convert to Notion format

        const formData = {
            title: document.getElementById("title").value,
            formattedBlocks: formattedBlocks, // Send formatted blocks
            authorId: selectedAuthorId.value,
            reviewType: document.getElementById("reviewType").value,
        };

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