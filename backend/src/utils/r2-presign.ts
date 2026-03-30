import { createHash, createHmac } from "node:crypto";

type PresignedR2UrlOptions = {
  accessKeyId: string;
  bucketName: string;
  expiresInSeconds: number;
  method?: "PUT" | "GET";
  objectKey: string;
  accountId: string;
  secretAccessKey: string;
  now?: Date;
};

const R2_REGION = "auto";
const R2_SERVICE = "s3";
const R2_ALGORITHM = "AWS4-HMAC-SHA256";

const encodeRfc3986 = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const buildCanonicalPath = (bucketName: string, objectKey: string) => {
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/");

  return `/${encodeRfc3986(bucketName)}/${encodedKey}`;
};

const formatAmzDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const formatDateStamp = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

const hashSha256 = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const sign = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value, "utf8").digest();

export const createR2PresignedUrl = ({
  accessKeyId,
  accountId,
  bucketName,
  expiresInSeconds,
  method = "PUT",
  objectKey,
  now = new Date(),
  secretAccessKey,
}: PresignedR2UrlOptions) => {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const amzDate = formatAmzDate(now);
  const dateStamp = formatDateStamp(now);
  const canonicalUri = buildCanonicalPath(bucketName, objectKey);
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const signedHeaders = "host";

  const baseQuery = {
    "X-Amz-Algorithm": R2_ALGORITHM,
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  };

  const canonicalQuery = Object.entries(baseQuery)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    R2_ALGORITHM,
    amzDate,
    credentialScope,
    hashSha256(canonicalRequest),
  ].join("\n");

  const signingKey = sign(
    sign(
      sign(sign(`AWS4${secretAccessKey}`, dateStamp), R2_REGION),
      R2_SERVICE,
    ),
    "aws4_request",
  );

  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const url = new URL(`https://${host}${canonicalUri}`);
  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
    url: url.toString(),
  };
};
