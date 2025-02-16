import { env } from "~/env";

export async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://notegpt.io/api/v2/video-transcript?platform=youtube&video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'referer': 'https://notegpt.io/youtube-transcript-generator',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'cookie': 'sbox-guid=MTczOTQxNDUxOHw0Nzl8OTU0NTMyNDkz; _uab_collina=173941452003834371214577; anonymous_user_id=ce48351d4dacd38436b589a22a1358f6; is_first_visit=true; _trackUserId=G-1739414520000; g_state={"i_l":0}; last_login=02c560166a860d8963cd32168893f2dc848eab7a077c024ca3b8185b62691c13a%3A2%3A%7Bi%3A0%3Bs%3A10%3A%22last_login%22%3Bi%3A1%3Bi%3A3%3B%7D; ZFSESSID=kqglj74eaj5ou4hr4uqvf78ru4'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get transcript: ${response.status} ${response.statusText}`);
    }

    interface TranscriptResponse {
      transcript: string;
    }

    const data = (await response.json()) as TranscriptResponse;
    return data.transcript || '';
  } catch (error) {
    console.error(`Failed to get transcript for video ${videoId}:`, error);
    throw error;
  }
} 