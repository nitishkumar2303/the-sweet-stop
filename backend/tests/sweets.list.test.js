// backend/tests/sweets.list.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";
import Sweet from "../src/models/Sweet.js";
import jwt from "jsonwebtoken";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function tokenFor(role = "user") {
  const email = `${Date.now()}@test.local`;
  const user = await User.create({ name: "T", email, password: "Pass123!", role });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "testsecret");
  return token;
}

describe("GET /api/sweets - list sweets", () => {
  test("returns 401 if no token provided", async () => {
    const res = await request(app).get("/api/sweets");
    expect(res.status).toBe(401);
  });

  test("returns 200 and an array for authenticated user", async () => {
    // seed some sweets
    await Sweet.create({ name: "A", category: "c", price: 10, quantity: 5 });
    await Sweet.create({ name: "B", category: "c2", price: 20, quantity: 2 });

    const token = await tokenFor("user");
    const res = await request(app).get("/api/sweets").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);

    // each item should contain expected fields
    const sample = res.body.items[0];
    expect(sample).toHaveProperty("id");
    expect(sample).toHaveProperty("name");
    expect(sample).toHaveProperty("category");
    expect(sample).toHaveProperty("price");
    expect(sample).toHaveProperty("quantity");
  });

  test("works for admin as well", async () => {
    await Sweet.create({ name: "C", category: "x", price: 5, quantity: 10 });
    const token = await tokenFor("admin");
    const res = await request(app).get("/api/sweets").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});