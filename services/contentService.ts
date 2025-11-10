const extractMainContent = (htmlString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove elements that are unlikely to contain main content
  ['script', 'style', 'nav', 'header', 'footer', 'aside', 'form'].forEach(tagName => {
    doc.querySelectorAll(tagName).forEach(el => el.remove());
  });

  // Prioritize common article containers
  const selectors = ['article', 'main', '.post-content', '.entry-content', '.aa_ht', '#content', 'body'];
  let bestContainer: Element | null = null;
  for (const selector of selectors) {
    bestContainer = doc.querySelector(selector);
    if (bestContainer) break;
  }

  if (!bestContainer) {
    throw new Error("Could not find a suitable content container in the page.");
  }

  const paragraphs = Array.from(bestContainer.querySelectorAll('p'));
  const textContent = paragraphs.map(p => p.textContent?.trim()).filter(Boolean).join('\n\n');

  // Fallback if no <p> tags are found, clean up all text content
  if (!textContent.trim()) {
    return bestContainer.textContent?.replace(/\s{2,}/g, '\n').trim() ?? '';
  }

  return textContent;
};

export const fetchTextFromUrl = async (url: string): Promise<string> => {
  if (!url.trim() || !url.startsWith('http')) {
     throw new Error("Please enter a valid URL (e.g., https://example.com).");
  }

  // Using a CORS proxy to bypass browser's same-origin policy.
  // Public proxies can be unreliable; switched from allorigins.win to corsproxy.io.
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch content (Status: ${response.status}). The target website may be blocking requests or is temporarily down.`);
    }
    const html = await response.text();
    const extractedText = extractMainContent(html);

    if (!extractedText.trim()) {
      throw new Error("Could not extract any meaningful text from the provided URL. The page might be structured in an unusual way.");
    }
    return extractedText;
  } catch (error) {
    console.error("Error fetching or parsing URL:", error);
    // The generic 'Failed to fetch' error often indicates a network or proxy issue.
    throw new Error("Could not retrieve content from the URL. This may be due to a network error, the CORS proxy service being unavailable, or the target website restricting access.");
  }
};
