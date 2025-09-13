const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCqDDM6Q1purcYsW8rfGXstQ'; // User's channel ID
const OUTPUT_PATH = './public/videos_data.json';

const getUploadsPlaylistId = async () => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'contentDetails',
        id: CHANNEL_ID,
        key: API_KEY,
      },
    });
    return response.data.items[0].contentDetails.relatedPlaylists.uploads;
  } catch (error) {
    console.error('Error fetching uploads playlist ID:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

const getPlaylistVideos = async (playlistId) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50, // Max 50 results per page
        key: API_KEY,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching playlist videos:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

const formatVideoData = (videos) => {
  return videos.map(item => {
    const snippet = item.snippet;
    const videoId = snippet.resourceId.videoId;
    return {
      id: videoId,
      title: snippet.title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      description: snippet.description,
      formatted_date: new Date(snippet.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  }).filter(video => video.title !== 'Private video'); // Filter out private videos
};

const main = async () => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY environment variable is not set.');
    process.exit(1);
  }
  console.log('Fetching uploads playlist ID...');
  const uploadsPlaylistId = await getUploadsPlaylistId();
  console.log(`Uploads playlist ID: ${uploadsPlaylistId}`);

  console.log('Fetching videos from playlist...');
  const videos = await getPlaylistVideos(uploadsPlaylistId);
  console.log(`Found ${videos.length} videos.`);

  console.log('Formatting video data...');
  const formattedVideos = formatVideoData(videos);

  console.log(`Writing ${formattedVideos.length} videos to ${OUTPUT_PATH}...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(formattedVideos, null, 2));

  console.log('Successfully updated videos data.');
};

main();
