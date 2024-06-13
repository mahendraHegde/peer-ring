import * as request from "supertest";

const API_URL = "http://127.0.0.1:4444";

function generateRandomNumbers(N: number): Array<string> {
  const randomNumbers: Map<string, boolean> = new Map();
  for (let i = 0; i < N; i++) {
    const randomNumber = Math.floor(Math.random() * (Math.pow(2, 32) - 1)) + 1;
    const num = String(randomNumber);
    if (!randomNumbers.has(num)) {
      randomNumbers.set(num, true);
    }
  }
  return Array.from<string>(randomNumbers.keys());
}

describe("API Tests", () => {
  generateRandomNumbers(500).map((key) => {
    test(`Cache Set, GET, delete should work when no preplication factor for key ${key}`, async () => {
      const path = `/kv/${key}`;
      let response = await request(API_URL).post("/kv").send({
        key,
        value: key,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toBe(key);

      response = await request(API_URL).del(path);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toEqual("");
    });
    test(`Cache Set, GET, delete should work with preplication factor and quorum for key ${key}`, async () => {
      const keyRepl = `repl_${key}`;
      const path = `/kv/${keyRepl}?replicationFactor=3&quorumCount=2`;
      let response = await request(API_URL)
        .post("/kv?replicationFactor=3&quorumCount=2")
        .send({
          key: keyRepl,
          value: keyRepl,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toBe(keyRepl);

      response = await request(API_URL).del(path);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toEqual("");
    });
    test(`Cache Set, GET, delete should work with preplication factor and quorum beyong available nodes for key ${key}`, async () => {
      const keyRepl = `repl_${key}`;
      const path = `/kv/${keyRepl}?replicationFactor=30&quorumCount=30`;
      let response = await request(API_URL)
        .post("/kv?replicationFactor=30&quorumCount=30")
        .send({
          key: keyRepl,
          value: keyRepl,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toBe(keyRepl);

      response = await request(API_URL).del(path);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});

      response = await request(API_URL).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toEqual("");
    });
  });
});
