import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@/components/ui/dialog";
import CreateExamDialogContent from "@/app/teacher/components/CreateExamDialogContent";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CreateExamDialogContent", () => {
  beforeEach(() => {
    push.mockReset();
    window.sessionStorage.clear();
  });

  const renderDialog = () =>
    render(
      <Dialog open>
        <CreateExamDialogContent />
      </Dialog>,
    );

  it("blocks manual navigation until a question is added", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /Гараар/ }));
    fireEvent.change(screen.getByPlaceholderText("Шалгалтын сэдвээ оруулна уу"), {
      target: { value: "Math quiz" },
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Асуулт нэмэх" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Асуултын текст оруулна уу.")).toBeInTheDocument();
  });

  it("blocks manual navigation when the title is missing", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /Гараар/ }));
    fireEvent.change(screen.getByPlaceholderText("Асуултаа оруулна уу."), {
      target: { value: "What is 2 + 2?" },
    });
    fireEvent.change(screen.getByPlaceholderText("Хариулт оруулна уу"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Асуулт нэмэх" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Гарчиг оруулна уу.")).toBeInTheDocument();
  });

  it("allows manual navigation after a title and first question are added", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /Гараар/ }));
    fireEvent.change(screen.getByPlaceholderText("Шалгалтын сэдвээ оруулна уу"), {
      target: { value: "Science quiz" },
    });
    fireEvent.change(screen.getByPlaceholderText("Асуултаа оруулна уу."), {
      target: { value: "What is a cell?" },
    });
    fireEvent.change(screen.getByPlaceholderText("Хариулт оруулна уу"), {
      target: { value: "Basic unit of life" },
    });
    fireEvent.change(screen.getByLabelText("Оноо"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Асуулт нэмэх" }));

    expect(push).toHaveBeenCalledWith("/teacher/createExam");
    expect(JSON.parse(window.sessionStorage.getItem("teacher:create-exam-dialog-payload") ?? "{}")).toEqual(
      expect.objectContaining({
        mode: "manual",
        examTitle: "Science quiz",
        questions: [
          expect.objectContaining({
            text: "What is a cell?",
            type: "open",
            correctAnswer: "Basic unit of life",
            points: 2,
          }),
        ],
      }),
    );
  });

  it("blocks AI navigation until required fields are filled", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /AI/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ноорог үүсгэх" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Шалгалтын гарчиг оруулна уу.")).toBeInTheDocument();
    expect(screen.getByText("Хичээл оруулна уу.")).toBeInTheDocument();
    expect(screen.getByText("Анги оруулна уу.")).toBeInTheDocument();
    expect(screen.getByText("Нэмэлт мэдээлэл оруулна уу.")).toBeInTheDocument();
  });

  it("navigates with AI draft payload after required fields are filled", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /AI/ }));
    fireEvent.change(screen.getByPlaceholderText("Жишээ нь: Present simple tense"), {
      target: { value: "Biology quiz" },
    });
    fireEvent.change(screen.getByPlaceholderText("Жишээ нь: Англи хэл"), {
      target: { value: "Science" },
    });
    fireEvent.change(screen.getByPlaceholderText("Хэддүгээр ангид зориулэх вэ?"), {
      target: { value: "10A" },
    });
    fireEvent.change(screen.getByPlaceholderText("Хэдэн асуулттай байх"), {
      target: { value: "8" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Жишээ нь: 70 хувь нь задгай даалгавар, 30 хувь нь нэг хариулттай гэх мэт...",
      ),
      {
        target: { value: "Mix short and open questions" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Ноорог үүсгэх" }));

    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("/teacher/createExam?mode=ai"),
    );
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("topic=Biology+quiz"),
    );
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("questionCount=8"),
    );
  });

  it("blocks PDF navigation until a file and counts are provided", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /PDF/ }));
    fireEvent.click(screen.getByRole("button", { name: "Асуулт үүсгэх" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Файл хавсаргана уу.")).toBeInTheDocument();
    expect(screen.getByText("Нийт асуулт дор хаяж 1 байх ёстой.")).toBeInTheDocument();
  });
});
