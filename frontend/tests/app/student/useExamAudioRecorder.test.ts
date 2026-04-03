import { classifyAudioUploadFailure } from "@/app/student/hooks/useExamAudioRecorder";

describe("classifyAudioUploadFailure", () => {
  it("marks missing R2 audio upload config as non-blocking", () => {
    expect(
      classifyAudioUploadFailure(
        new Error(
          JSON.stringify({
            success: false,
            error: {
              code: "R2_UPLOAD_NOT_CONFIGURED",
              message: "Audio uploads are not configured yet.",
            },
          }),
        ),
      ),
    ).toEqual({
      blocking: false,
      nextStatus: "unsupported",
      message:
        "Audio uploads are not configured on the server right now. The exam can continue without blocking audio upload.",
    });
  });

  it("keeps ordinary upload failures blocking", () => {
    expect(classifyAudioUploadFailure(new Error("upload failed"))).toEqual({
      blocking: true,
      nextStatus: null,
      message: null,
    });
  });
});
