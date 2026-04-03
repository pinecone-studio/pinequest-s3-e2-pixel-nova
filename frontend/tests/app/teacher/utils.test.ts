import { isQuestionTextSuspicious } from "@/app/teacher/utils";

describe("teacher utils", () => {
  it("marks repeated-character OCR gibberish as suspicious", () => {
    expect(
      isQuestionTextSuspicious(
        "10 nn nnnnnnn nnnn 5 n nnn nnnnnnnn . nnnnnnnnn nn nn ? a = F/m = 5 / 10 =",
      ),
    ).toBe(true);
  });

  it("keeps normal question text valid", () => {
    expect(
      isQuestionTextSuspicious("10 Н хүчээр 5 кг биетэд үйлчлэхэд a = F/m хэд вэ?"),
    ).toBe(false);
  });
});
