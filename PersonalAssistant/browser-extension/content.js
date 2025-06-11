// Track YouTube video watches in real-time
let currentVideo = null;
const API_ENDPOINT = 'http://localhost:3000/api/activities/youtube/track';

function getVideoInfo() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  const titleElement = document.querySelector('h1.title yt-formatted-string');
  const channelElement = document.querySelector('#channel-name a');
  
  if (videoId && titleElement) {
    return {
      videoId,
      title: titleElement.textContent,
      channel: channelElement?.textContent || 'Unknown',
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
  return null;
}

function trackVideo() {
  const videoInfo = getVideoInfo();
  
  if (videoInfo && videoInfo.videoId !== currentVideo) {
    currentVideo = videoInfo.videoId;
    
    // Send to your backend
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pa_token')}`
      },
      body: JSON.stringify(videoInfo)
    }).catch(console.error);
  }
}

// Track on page load and navigation
trackVideo();

// YouTube uses dynamic navigation, so monitor for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(trackVideo, 1000); // Wait for page to load
  }
}).observe(document, { subtree: true, childList: true });