import app from "../src/index";

describe("backend worker", () => {
	it("returns the message endpoint response", async () => {
		const response = await app.request("http://localhost/message");

		expect(response.status).toBe(200);
		await expect(response.text()).resolves.toBe("Hello Hono!");
	});
});
