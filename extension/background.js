chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle the message
  if (message.type === 'exampleMessage') {
    // Perform some action
    const result = performAction(message.data);

    // Send a response back to the content script
    sendResponse({ success: true, result });
  } else {
    // Send an error response if the message type is not recognized
    sendResponse({ success: false, error: 'Unknown message type' });
  }

  // Return true to indicate that the response will be sent asynchronously
  return true;
});

function performAction(data) {
  // Perform some action with the data and return the result
  return `Processed data: ${data}`;
}
