export const formatResponseForSharing = (question: string, answer: string): string => {
  return `Question: ${question}

Answer: ${answer}

Shared from Truth Me Up - Catholic Teaching Assistant
https://truthmeup.com`;
};

export const copyResponseToClipboard = async (question: string, answer: string): Promise<boolean> => {
  try {
    const formattedText = formatResponseForSharing(question, answer);
    
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern clipboard API
      await navigator.clipboard.writeText(formattedText);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = formattedText;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
};