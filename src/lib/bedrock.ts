import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { env } from "@/env";

export const bedrock = createAmazonBedrock({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

export const model = bedrock(env.BEDROCK_MODEL_ID);
