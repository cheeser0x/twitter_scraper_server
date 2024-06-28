const fs = require('fs');

function cleanData(data) {
  // Extract screen names and format them
  const screenNames = data
    .filter(item => item?.content?.itemContent?.user_results?.result?.legacy?.screen_name)
    .map(item => '@' + item.content.itemContent.user_results.result.legacy.screen_name);

  // Join the screen names with new lines
  const formattedScreenNames = screenNames.join('\n');
  
  return formattedScreenNames;
}

module.exports = { cleanData };
