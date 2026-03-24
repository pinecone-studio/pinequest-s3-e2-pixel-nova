import { render } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
	}),
}));

describe("Home", () => {
	it("renders the page container", () => {
		const { container } = render(<Home />);

		expect(container.firstChild).toBeInTheDocument();
		expect(container.firstChild?.nodeName).toBe("DIV");
	});
});
