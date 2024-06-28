const fetch = require('node-fetch');
const { cleanData } = require('./dataCleaner');

function getRandomTimeout(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

async function fetchWithCursor(url, apiKey, tweetId, cleanedData = '', callCount = 1) {
  console.log(`Making API call number ${callCount}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Cookie': '_ga=GA1.2.10087841.1705483061; g_state={"i_l":0}; dnt=1; kdt=B3jWknWXPb9ylySf0jtVAqNmHu8vqrkl8Mt7VmDM; lang=en; auth_multi="1720410295020232704:2e808b6e7b78f930a0cd9beaaae5264b9d4df0c6"; auth_token=70a4296dd20e240f24e260e5741a9ef3d81f9dce; guest_id_ads=v1%3A171855853175183501; guest_id_marketing=v1%3A171855853175183501; guest_id=v1%3A171855853175183501; twid=u%3D1742948151701753856; ct0=ba1dfd144c57d1e4b9ca72b1955e35593e8ddd7cfbe39f31a9a93d87f8e0e9606c86e36463285d5a74c053df359cb5ae15400f126e911af8df2c51d6a63b1f307782483a67a416c576d20092f23e21ec; personalization_id="v1_OJOJ4il9gfgw6AZGP+iCqg=="',
        'X-Csrf-Token': "ba1dfd144c57d1e4b9ca72b1955e35593e8ddd7cfbe39f31a9a93d87f8e0e9606c86e36463285d5a74c053df359cb5ae15400f126e911af8df2c51d6a63b1f307782483a67a416c576d20092f23e21ec"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const entries = data.data.retweeters_timeline.timeline.instructions[0].entries || [];
    const newEntries = entries.filter(entry => entry.content.entryType === "TimelineTimelineItem");

    // Clean the new entries and accumulate the cleaned data
    const cleanedEntries = cleanData(newEntries);
    cleanedData += cleanedEntries + '\n';

    console.log(`Appended cleaned data from call ${callCount}. Current length of cleaned data: ${cleanedData.length}`);

    const cursorEntry = entries.find(entry => entry.content.entryType === "TimelineTimelineCursor" && entry.content.cursorType === "Bottom");
    const cursor = cursorEntry ? cursorEntry.content.value : null;

    if (!cursor || newEntries.length < 20) {
      console.log('Reached the end of available data.');
      return cleanedData;
    } else {
      const timeout = getRandomTimeout(11, 17);
      console.log(`Waiting for ${timeout / 1000} seconds before next API call`);
      await new Promise(resolve => setTimeout(resolve, timeout));
      const nextUrl = `https://x.com/i/api/graphql/lR6N-4vjw47alP1RHfhxkg/Retweeters?variables=%7B%22tweetId%22%3A%22${encodeURIComponent(tweetId)}%22%2C%22count%22%3A20%2C%22cursor%22%3A%22${encodeURIComponent(cursor)}%22%2C%22includePromotedContent%22%3Atrue%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D`;
      return fetchWithCursor(nextUrl, apiKey, tweetId, cleanedData, callCount + 1);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return cleanedData;
  }
}

async function getDataAndWriteFile(tweetId) {
  const initialUrl = `https://x.com/i/api/graphql/lR6N-4vjw47alP1RHfhxkg/Retweeters?variables=%7B%22tweetId%22%3A%22${encodeURIComponent(tweetId)}%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Atrue%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D`;
  const apiKey = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

  const cleanedData = await fetchWithCursor(initialUrl, apiKey, tweetId);
  
  return cleanedData;
}

module.exports = { getDataAndWriteFile };
