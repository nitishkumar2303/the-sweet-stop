// backend/tests/sweets.search.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import Sweet from "../src/models/Sweet.js";
import User from "../src/models/User.js";
import jwt from "jsonwebtoken";

let mongoServer;

// Helper to create token (creates a real user in test DB)
async function tokenFor(role = "user") {
  const email = `${Date.now()}@test.local`;
  const user = await User.create({ name: "T", email, password: "Pass123!", role });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "testsecret");
  return token;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /api/sweets/search", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/sweets/search");
    expect(res.status).toBe(401);
  });

  test("returns sweets filtered by name", async () => {
    await Sweet.create([
      { name: "Ladoo", category: "Indian", price: 10, quantity: 20 },
      { name: "Chocolate Bar", category: "Western", price: 50, quantity: 5 },
      { name: "Barfi", category: "Indian", price: 30, quantity: 10 },
    ]);

    const token = await tokenFor("user");

    const res = await request(app)
      .get("/api/sweets/search?name=bar")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2); // Chocolate Bar + Barfi
  });

  test("filters by category", async () => {
    await Sweet.create([
      { name: "Ladoo", category: "Indian", price: 10, quantity: 20 },
      { name: "Barfi", category: "Indian", price: 30, quantity: 10 },
      { name: "Donut", category: "Western", price: 40, quantity: 8 },
    ]);

    const token = await tokenFor("user");

    const res = await request(app)
      .get("/api/sweets/search?category=Indian")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
  });

  test("filters by price range", async () => {
    await Sweet.create([
      { name: "Ladoo", category: "Indian", price: 10, quantity: 20 },
      { name: "Barfi", category: "Indian", price: 30, quantity: 10 },
      { name: "Kaju Katli", category: "Indian", price: 100, quantity: 5 },
    ]);

    const token = await tokenFor("user");

    const res = await request(app)
      .get("/api/sweets/search?min=20&max=60")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1); // Barfi
  });
});