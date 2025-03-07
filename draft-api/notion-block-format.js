import * as cheerio from "cheerio";

export function parseHTML(html) {
    const $ = cheerio.load(html);
    let notionBlocks = [];

    $("p, ul").each((_, elem) => {
        const tag = $(elem).prop("tagName").toLowerCase();

        // Handle paragraphs
        if (tag === "p") {
            const richText = [];
            $(elem).contents().each((_, node) => {
                if (node.type === 'text') {
                    const textContent = node.data.trim();
                    if (textContent) {
                        richText.push({
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
                        });
                    }
                } else if (node.type === 'tag' && node.name === "a") {
                    const url = $(node).attr("href");
                    const linkText = $(node).text().trim();
                    if (linkText && url) {
                        richText.push({
                            type: "text",
                            text: { content: linkText, link: { url } },
                            annotations: { 
                                bold: false, 
                                italic: false, 
                                strikethrough: false, 
                                underline: false, 
                                code: false, 
                                color: "default" 
                            },
                            plain_text: linkText, // No space here to avoid double spacing
                            href: url
                        });
                        // Add a space after the link
                        richText.push({
                            type: "text",
                            text: { content: " ", link: null }, // Add space after the link
                            annotations: { 
                                bold: false, 
                                italic: false, 
                                strikethrough: false, 
                                underline: false, 
                                code: false, 
                                color: "default" 
                            },
                            plain_text: " ", // Space for formatting
                            href: null
                        });
                    }
                }
            });

            // Create Notion block for the paragraph
            if (richText.length > 0) {
                notionBlocks.push({
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: richText
                    }
                });
            }
        }

        // Handle unordered lists
        if (tag === "ul") {
            $(elem).find("li").each((_, li) => {
                const richText = [];
                $(li).contents().each((_, node) => {
                    if (node.type === 'text') {
                        const textContent = node.data.trim();
                        if (textContent) {
                            richText.push({
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
                            });
                        }
                    } else if (node.type === 'tag' && node.name === "a") {
                        const url = $(node).attr("href");
                        const linkText = $(node).text().trim();
                        if (linkText && url) {
                            richText.push({
                                type: "text",
                                text: { content: linkText, link: { url } },
                                annotations: { 
                                    bold: false, 
                                    italic: false, 
                                    strikethrough: false, 
                                    underline: false, 
                                    code: false, 
                                    color: "default" 
                                },
                                plain_text: linkText, // No space here to avoid double spacing
                                href: url
                            });
                            // Add a space after the link
                            richText.push({
                                type: "text",
                                text: { content: " ", link: null }, // Add space after the link
                                annotations: { 
                                    bold: false, 
                                    italic: false, 
                                    strikethrough: false, 
                                    underline: false, 
                                    code: false, 
                                    color: "default" 
                                },
                                plain_text: " ", // Space for formatting
                                href: null
                            });
                        }
                    }
                });

                // Create Notion block for the list item
                if (richText.length > 0) {
                    notionBlocks.push({
                        object: "block",
                        type: "bulleted_list_item",
                        bulleted_list_item: {
                            rich_text: richText
                        }
                    });
                }
            });
        }
    });

    return notionBlocks;
}

