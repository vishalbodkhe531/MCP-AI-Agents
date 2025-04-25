import { config } from "dotenv";
import { TwitterApi } from "twitter-api-v2";

config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_KEY_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

export const createPost = async (status: string) => {
  console.log(status);
  const res = await twitterClient.v2.tweet(status);
  console.log("res : ", res);

  return {
    content: [
      {
        type: "text",
        text: `Twitted : ${status}`,
      },
    ],
  };
};
