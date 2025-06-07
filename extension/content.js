chrome.runtime.sendMessage(
  { type: 'exampleMessage', data: 'some data' },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError.message);
    } else if (response.success) {
      console.log('Response:', response.result);
    } else {
      console.error('Error:', response.error);
    }
  }
);
