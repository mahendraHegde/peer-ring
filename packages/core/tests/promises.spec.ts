import { promiseRaceWithCount } from "../src/helpers/promises";

describe("promiseRaceWithCount", () => {
  it("should resolve the first 2 promises out of 3", async () => {
    const p1 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(1), 100),
    );
    const p2 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(2), 200),
    );
    const p3 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(3), 300),
    );

    const promises = [p1, p2, p3];
    const count = 2;
    const results = await promiseRaceWithCount(promises, count);

    expect(results).toEqual({ results: [1, 2], errors: [] });
  });

  it("should resolve the first 3 promises out of 5", async () => {
    const p1 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(1), 100),
    );
    const p2 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(2), 200),
    );
    const p3 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(3), 300),
    );
    const p4 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(4), 400),
    );
    const p5 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(5), 500),
    );

    const promises = [p1, p2, p3, p4, p5];
    const count = 3;
    const results = await promiseRaceWithCount(promises, count);

    expect(results).toEqual({ results: [1, 2, 3], errors: [] });
  });

  it("should handle rejected promises correctly", async () => {
    const p1 = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("error 1")), 100),
    );
    const p2 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(2), 200),
    );
    const p3 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(3), 300),
    );
    const p4 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(4), 400),
    );

    const promises = [p1, p2, p3, p4];
    const count = 2;
    const results = await promiseRaceWithCount(promises, count);

    expect(results).toEqual({ results: [2, 3], errors: [] });
  });

  it("should resolve fewer promises if not enough are resolved", async () => {
    const p1 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(1), 100),
    );
    const p2 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(2), 200),
    );

    const promises = [p1, p2];
    const count = 3;
    const results = await promiseRaceWithCount(promises, count);

    expect(results).toEqual({ results: [1, 2], errors: [] });
  });

  it("should resolve/reject some promises", async () => {
    const p1 = new Promise<number>((resolve) =>
      setTimeout(() => resolve(1), 100),
    );
    const p2 = new Promise<number>((_, reject) =>
      setTimeout(() => reject(2), 200),
    );

    const promises = [p1, p2];
    const count = 3;
    const results = await promiseRaceWithCount(promises, count);

    expect(results).toEqual({ results: [1], errors: [2] });
  });
});
