const fs = require("fs");
const supertest = require("supertest");
const chai = require("chai");
const { expect } = chai;

describe("Highload test", () => {
  it("10000 requests", async function () {
    this.timeout(0);

    const concurrentRequests = 10000;
    const requests = Array(concurrentRequests).fill({ userId: 1, amount: 2 });

    const responses = await Promise.all(
      requests.map(async (req) => {
        try {
          const response = await supertest("http://localhost:3000")
            .post("/update-balance")
            .send(req);
          return response.text;
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      })
    );

    fs.writeFileSync(
      "./tests/responses.json",
      JSON.stringify(responses, null, 2)
    );

    const successfulResponses = responses.filter(
      (response) => !response.includes("error")
    );
    expect(successfulResponses).to.have.lengthOf(5000);
  });
});
