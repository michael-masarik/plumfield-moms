/**
 * Parses HTML content and converts it into Notion blocks.
 * 
 * @param {string} html - The HTML content to parse.
 * @returns {Array} An array of Notion blocks.
 */
function parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let notionBlocks = [];

    // Function to process rich text with annotations
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent.trim();
            if (!textContent) return null;

            return {
                type: "text",
                text: { content: textContent + " ", link: null }, // Add space
                annotations: { 
                    bold: false, 
                    italic: false, 
                    strikethrough: false, 
                    underline: false, 
                    code: false, 
                    color: "default" 
                },
                plain_text: textContent + " ", // Add space
                href: null
            };
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            let richText = [];
            
            if (tag === "a") {
                const url = node.getAttribute("href");
                node.childNodes.forEach((child) => {
                    const processed = processNode(child);
                    if (processed) {
                        processed.text.link = { url };
                        processed.href = url;
                        richText.push(processed);
                    }
                });

                // Add space after the link
                richText.push({
                    type: "text",
                    text: { content: " ", link: null },
                    annotations: { 
                        bold: false, 
                        italic: false, 
                        strikethrough: false, 
                        underline: false, 
                        code: false, 
                        color: "default" 
                    },
                    plain_text: " ",
                    href: null
                });

                return richText;
            }

            // Handle formatting elements
            let annotations = {
                bold: tag === "b" || tag === "strong",
                italic: tag === "i" || tag === "em",
                strikethrough: tag === "s" || tag === "del",
                underline: tag === "u",
                code: tag === "code",
                color: "default"
            };

            node.childNodes.forEach((child) => {
                const processed = processNode(child);
                if (processed) {
                    if (Array.isArray(processed)) {
                        processed.forEach((p) => Object.assign(p.annotations, annotations));
                        richText.push(...processed);
                    } else {
                        Object.assign(processed.annotations, annotations);
                        richText.push(processed);
                    }
                }
            });

            return richText;
        }

        return null;
    }

    // Process paragraphs and unordered lists
    doc.querySelectorAll("p, ul").forEach((elem) => {
        const tag = elem.tagName.toLowerCase();

        if (tag === "p") {
            let richText = [];
            elem.childNodes.forEach((node) => {
                const processed = processNode(node);
                if (processed) {
                    if (Array.isArray(processed)) {
                        richText.push(...processed);
                    } else {
                        richText.push(processed);
                    }
                }
            });

            if (richText.length > 0) {
                notionBlocks.push({
                    object: "block",
                    type: "paragraph",
                    paragraph: { rich_text: richText }
                });
            }
        }

        if (tag === "ul") {
            elem.querySelectorAll("li").forEach((li) => {
                let richText = [];
                li.childNodes.forEach((node) => {
                    const processed = processNode(node);
                    if (processed) {
                        if (Array.isArray(processed)) {
                            richText.push(...processed);
                        } else {
                            richText.push(processed);
                        }
                    }
                });

                if (richText.length > 0) {
                    notionBlocks.push({
                        object: "block",
                        type: "bulleted_list_item",
                        bulleted_list_item: { rich_text: richText }
                    });
                }
            });
        }
    });

    return notionBlocks;
}
//Main body code

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
        console.log("Review Type:", formData.reviewType);

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