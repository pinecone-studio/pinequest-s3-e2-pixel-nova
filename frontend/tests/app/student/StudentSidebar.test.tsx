import { render, screen, fireEvent } from "@testing-library/react";
import StudentSidebar from "@/app/student/components/StudentSidebar";
import { createRef } from "react";

const makeProps = (overrides: Record<string, unknown> = {}) => ({
	collapsed: false,
	setCollapsed: jest.fn(),
	activeTab: "Шалгалт" as const,
	setActiveTab: jest.fn(),
	sidebarTimerRef: createRef<number | null>() as React.MutableRefObject<number | null>,
	...overrides,
});

describe("StudentSidebar", () => {
	it("renders all 5 tab buttons", () => {
		render(<StudentSidebar {...makeProps()} />);

		expect(screen.getAllByText("Шалгалт").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Дүн").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Профайл").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Тохиргоо").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Тусламж").length).toBeGreaterThan(0);
	});

	it("renders localized branding when expanded", () => {
		render(<StudentSidebar {...makeProps()} />);

		expect(screen.getByText("Эдүкор")).toBeInTheDocument();
		expect(screen.getByText("Суралцах төв")).toBeInTheDocument();
	});

	it("calls setActiveTab when tab is clicked", () => {
		const setActiveTab = jest.fn();
		render(<StudentSidebar {...makeProps({ setActiveTab })} />);

		const dunButtons = screen.getAllByText("Дүн");
		fireEvent.click(dunButtons[0]);

		expect(setActiveTab).toHaveBeenCalledWith("Дүн");
	});

	it("calls setCollapsed(false) on mouse enter", () => {
		const setCollapsed = jest.fn();
		const { container } = render(
			<StudentSidebar {...makeProps({ setCollapsed })} />,
		);

		const aside = container.querySelector("aside")!;
		fireEvent.mouseEnter(aside);

		expect(setCollapsed).toHaveBeenCalledWith(false);
	});

	it("sets collapse timer on mouse leave", () => {
		jest.useFakeTimers();
		const setCollapsed = jest.fn();
		const { container } = render(
			<StudentSidebar {...makeProps({ setCollapsed })} />,
		);

		const aside = container.querySelector("aside")!;
		fireEvent.mouseLeave(aside);

		jest.advanceTimersByTime(800);

		expect(setCollapsed).toHaveBeenCalledWith(true);
		jest.useRealTimers();
	});

	it("renders logout button", () => {
		render(<StudentSidebar {...makeProps()} />);

		expect(screen.getByText("Гарах")).toBeInTheDocument();
	});

	it("applies collapsed width class", () => {
		const { container } = render(
			<StudentSidebar {...makeProps({ collapsed: true })} />,
		);

		const aside = container.querySelector("aside")!;
		expect(aside.className).toContain("w-20");
	});

	it("applies expanded width class", () => {
		const { container } = render(
			<StudentSidebar {...makeProps({ collapsed: false })} />,
		);

		const aside = container.querySelector("aside")!;
		expect(aside.className).toContain("w-64");
	});

	it("clicking each tab calls setActiveTab with correct key", () => {
		const setActiveTab = jest.fn();
		render(<StudentSidebar {...makeProps({ setActiveTab })} />);

		const tabKeys = ["Шалгалт", "Дүн", "Профайл", "Тохиргоо", "Тусламж"];
		for (const key of tabKeys) {
			const buttons = screen.getAllByText(key);
			fireEvent.click(buttons[0]);
		}

		expect(setActiveTab).toHaveBeenCalledTimes(5);
		expect(setActiveTab).toHaveBeenCalledWith("Тусламж");
	});
});
