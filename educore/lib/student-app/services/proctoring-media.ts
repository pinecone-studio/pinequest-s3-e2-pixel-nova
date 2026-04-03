import {
  createAudioUploadUrl,
  createSnapshotUploadUrl,
  finalizeAudioUpload,
} from "./api";
import type {
  AudioChunkUploadPayload,
  AuthUser,
  SnapshotUploadPayload,
} from "@/types/student-app";

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Медиа өгөгдлийг уншиж чадсангүй: ${response.status}`);
  }
  return response.blob();
};

const localUriToBlob = async (uri: string) => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Локал медиа файлыг уншиж чадсангүй: ${response.status}`);
  }
  return response.blob();
};

const uploadBlob = async (
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  blob: Blob,
) => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Медиа файл илгээхэд алдаа гарлаа: ${response.status}`);
  }
};

export const uploadSnapshotFromBase64 = async (
  student: AuthUser,
  payload: SnapshotUploadPayload,
  base64: string,
) => {
  const upload = await createSnapshotUploadUrl(student, payload);
  const blob = await dataUrlToBlob(
    `data:${payload.mimeType};base64,${base64}`,
  );
  await uploadBlob(upload.uploadUrl, upload.uploadHeaders, blob);
  return upload;
};

export const uploadAudioChunkFromUri = async (
  student: AuthUser,
  payload: AudioChunkUploadPayload,
  uri: string,
) => {
  const upload = await createAudioUploadUrl(student, payload);
  const blob = await localUriToBlob(uri);

  await uploadBlob(upload.uploadUrl, upload.uploadHeaders, blob);
  await finalizeAudioUpload(student, {
    ...payload,
    objectKey: upload.objectKey,
  });

  return upload;
};
