const request = require("supertest");
const app = require("../week-3-middleware/app");
const fs = require("fs");
const path = require("path");

let logSpy;
let errorSpy;
let warnSpy;

beforeAll(() => {
	logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
	errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	logSpy.mockRestore();
	errorSpy.mockRestore();
	warnSpy.mockRestore();
	app.close();
});

describe("Middleware Integration", () => {
	describe("[Built-In Middleware]", () => {
		describe("[JSON Parse] POST /adopt", () => {
			let res;
			beforeAll(async () => {
				res = await request(app)
					.post("/adopt")
					.send({ dogName: "Sweet Pea", name: "Ellen", email: "ellen@codethedream.com" })
					.set("Content-Type", "application/json");
			});

			test("responds with status 201", () => {
				expect(res.status).toBe(201);
			});

			test("responds with correct message", () => {
				expect(res.body.message).toMatch(
					/Adoption request received. We will contact you at ellen@codethedream.com for further details./
				);
			});
		});

		describe("[Static] GET /images/dachshund.png", () => {
			let res;
			const imagePath = path.join(__dirname, "../public/images/dachshund.png");

			beforeAll(() => {
				if (!fs.existsSync(imagePath)) {
					fs.mkdirSync(path.dirname(imagePath), { recursive: true });
					fs.writeFileSync(imagePath, "fake image content");
				}
			});

			beforeAll(async () => {
				res = await request(app).get("/images/dachshund.png");
			});

			test("responds with status 200", () => {
				expect(res.status).toBe(200);
			});

			test("has image/png content type", () => {
				expect(res.headers["content-type"]).toMatch(/image\/png/);
			});
		});
	});

	describe("[Custom Middleware]", () => {
		describe("[Request ID]", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/dogs");
			});

			test("adds requestId header", () => {
				expect(res.headers["x-request-id"]).toBeDefined();
			});
		});

		describe("[Logging]", () => {
			test("logs request with method, path, and requestId", async () => {
				await request(app).get("/dogs");
				expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\]: GET \/dogs \(.+\)/));
			});
		});

		describe("[Error Handling] GET /error", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/error");
			});

			test("responds with status 500", () => {
				expect(res.status).toBe(500);
			});

			test("responds with a requestId", () => {
				expect(res.body.requestId).toBeDefined();
			});

			test("responds with 'Internal Server Error'", () => {
				expect(res.body.error).toBe("Internal Server Error");
			});
		});
	});

	describe("[Enhanced Middleware Features]", () => {
		describe("[Security Headers]", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/dogs");
			});

			test("sets X-Content-Type-Options header", () => {
				expect(res.headers["x-content-type-options"]).toBe("nosniff");
			});

			test("sets X-Frame-Options header", () => {
				expect(res.headers["x-frame-options"]).toBe("DENY");
			});

			test("sets X-XSS-Protection header", () => {
				expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
			});
		});

		describe("[Request Size Limiting]", () => {
			test("accepts requests within size limit", async () => {
				const res = await request(app)
					.post("/adopt")
					.send({ dogName: "Sweet Pea", name: "Test User", email: "test@example.com" })
					.set("Content-Type", "application/json");
				expect(res.status).toBe(201);
			});
		});

		describe("[Content-Type Validation]", () => {
			test("rejects POST requests without JSON content-type", async () => {
				const res = await request(app)
					.post("/adopt")
					.send(JSON.stringify({ dogName: "Sweet Pea", name: "Test User", email: "test@example.com" }))
					.set("Content-Type", "text/plain");
				expect(res.status).toBe(400);
				expect(res.body.error).toMatch(/Content-Type must be application\/json/);
			});

			test("allows GET requests without content-type validation", async () => {
				const res = await request(app).get("/dogs");
				expect(res.status).toBe(200);
			});
		});

		describe("[404 Handler]", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/nonexistent-route");
			});

			test("responds with status 404", () => {
				expect(res.status).toBe(404);
			});

			test("responds with error message", () => {
				expect(res.body.error).toBe("Route not found");
			});

			test("includes requestId in 404 response", () => {
				expect(res.body.requestId).toBeDefined();
			});
		});
	});

	describe("[Advanced Error Handling]", () => {
		describe("[Custom Error Classes]", () => {
			describe("[ValidationError]", () => {
				let res;

				beforeAll(async () => {
					res = await request(app)
						.post("/adopt")
						.send({ dogName: "Sweet Pea" }) // Intentional Missing required fields
						.set("Content-Type", "application/json");
				});

				test("responds with status 400", () => {
					expect(res.status).toBe(400);
				});

				test("responds with validation error message", () => {
					expect(res.body.error).toMatch(/Missing required fields/);
				});

				test("includes requestId", () => {
					expect(res.body.requestId).toBeDefined();
				});
			});

			describe("[NotFoundError]", () => {
				let res;

				beforeAll(async () => {
					res = await request(app)
						.post("/adopt")
						.send({ dogName: "Nonexistent Dog", name: "Test User", email: "test@example.com" })
						.set("Content-Type", "application/json");
				});

				test("responds with status 404", () => {
					expect(res.status).toBe(404);
				});

				test("responds with not found error message", () => {
					expect(res.body.error).toMatch(/not found or not available/);
				});

				test("includes requestId", () => {
					expect(res.body.requestId).toBeDefined();
				});
			});

			describe("[Error Logging]", () => {
				test("logs validation errors as WARN level", async () => {
					await request(app)
						.post("/adopt")
						.send({ dogName: "Sweet Pea" })
						.set("Content-Type", "application/json");
					expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN: ValidationError/));
				});

				test("logs not found errors as WARN level", async () => {
					await request(app)
						.post("/adopt")
						.send({ dogName: "Nonexistent Dog", name: "Test User", email: "test@example.com" })
						.set("Content-Type", "application/json");
					expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN: NotFoundError/));
				});

				test("logs server errors as ERROR level", async () => {
					await request(app).get("/error");
					expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/ERROR: Error/));
				});
			});
		});
	});
});
