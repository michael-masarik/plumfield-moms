
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
            toolbar: [["link","bold", "italic"]],
        },
    });
    
   
    
    

    const form = document.getElementById("review-form");
    const selectedAuthorId = document.getElementById("selectedAuthorId");
    const messageDiv = document.getElementById("message");
    const messageBackdrop = document.getElementById("message-backdrop");
    function showMessage(message){
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        messageBackdrop.style.display = "block";
        setTimeout(function() {
            messageDiv.style.display = "none";
            messageBackdrop.style.display = "none";
        }, 3500);
    }
    //debug
    document.getElementById("debug").addEventListener("click", function() {
        
        showMessage( "<p>Debug mode is ON</p>");
    });
    //hide message
    document.getElementById("message").addEventListener("click", function() {
        messageDiv.style.display = "none";
    });
    
    

  
    

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
    console.log("✅ Form submitted!");
        const submitButton = document.getElementById("submit");
        const title = document.getElementById("title").value;
        const reviewType = document.getElementById("reviewType").value;
        const authorId = selectedAuthorId.value;
    
        if (!title || !reviewType || !authorId) {
            alert("❌ Please fill in all required fields.");
            return;
        }
        // Show spinner and disable submit button
        spinner.style.display = "block";
        submitButton.disabled = true;
    
        // Convert Quill editor content to Notion format
        const richTextContent = quill.root.innerHTML; 
        const formattedBlocks = parseHTML(richTextContent); 
        const coverImage = "https://drive.google.com/uc?export=view&id=1cTazbHzIIAvmSu3wH9beVavJrf5aSkbz";
        const pbReviewIcon= "1M7PawIFoO2bR5g3KoR9v6fX88rJY7yEl";
        const bookReviewIcon = "1Dy-i3AR7CP0yu3K6cVbfMhxXiGlpV_MC";
        const reflectionIcon = "1dvT4G75URxVY5V1LZFTDeokDWJ0alLRR";
        const fileURL= "https://drive.google.com/uc?export=view&id=";
        function determineIcon (reviewType){
            if(reviewType == "pictureBookReview"){
                return `${fileURL}${pbReviewIcon}`
            }if(reviewType == "bookReview"){
                return `${fileURL}${bookReviewIcon}`
            }if(reviewType == "reflection"){
                return `${fileURL}${reflectionIcon}`
            }
            
        }
        
    
        const iconURL = determineIcon(reviewType);

        const formData = { 
            title, 
            formattedBlocks, 
            authorId, 
            reviewType,
            cover: {
                type: "external",
                external: {
                    url: coverImage
                }
            },
            icon: iconURL ? {
                type: "external",
                external: {
                    url: iconURL
                }
            } : undefined  // Avoid sending `undefined` values in the API request
        }; 
        
    
        let endpoint;
        switch (reviewType) {
            case "bookReview":
                endpoint = "/submit/bookReview";
                break;
            case "pictureBookReview":
                endpoint = "/submit/pictureBookReview";
                break;
            case "reflection":
                endpoint = "/submit/reflection";
                break;
            default:
               showMessage("<p>❌ Error: Invalid review type.</p>");
                return;
        }
        console.log("Submitting review type:", reviewType);
    
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
                
            });
            
            if (!response.ok) {
                let errorMessage = "Unknown error occurred.";
                
                try {
                    // Try to parse JSON error response
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (error) {
                    // If response is not JSON (like an authentication error), get plain text
                    errorMessage = await response.text();
                }
            
                throw new Error(errorMessage);
            }
            spinner.style.display = "none"; // Hide spinner
            submitButton.disabled = false; // Enable submit
            //form.reset();  // Clear form fields
            messageDiv.style.display = "block";
            showMessage("<p>✅ Review submitted successfully!</p>");
            console.log("Review submitted successfully!");
    
        } catch (error) {
            console.error("Error submitting review:", error);
            messageDiv.style.display = "block";
            showMessage(`<p>❌ Error: ${error.message}. Please try again.</p>`);
            spinner.style.display = "none"; // Hide spinner
            submitButton.disabled = false; // Enable submit
            console.error("Error submitting review:", error);
        }
    });
    

});