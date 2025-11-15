// backend/tests/sweets.create.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";
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

// helper to create a user and return token
async function tokenFor(role = "user") {
  const email = `${Date.now()}@test.local`;
  const user = await User.create({ name: "T", email, password: "Pass123!", role });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "testsecret");
  return token;
}

describe("POST /api/sweets - create sweet (admin only)", () => {
  test("returns 401 when no token provided", async () => {
    const res = await request(app)
      .post("/api/sweets")
      .send({ name: "Ladoo", category: "Indian", price: 10, quantity: 50 });

    expect(res.status).toBe(401);
  });

  test("returns 403 when non-admin tries to create a sweet", async () => {
    const token = await tokenFor("user"); // normal user
    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "BadSweet", category: "x", price: 1, quantity: 1 });

    expect(res.status).toBe(403);
  });

  test("returns 400 when admin provides invalid/missing fields", async () => {
    const token = await tokenFor("admin"); // admin
    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "OnlyName" }); // missing category, price, quantity

    expect(res.status).toBe(400);
  });

  test("admin can create a sweet and returns 201 with sweet data", async () => {
    const token = await tokenFor("admin");
    const body = { name: "Gulab Jamun", category: "Indian", price: 25, quantity: 30 };

    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name", "Gulab Jamun");
  });

  test("returns 409 when creating a sweet with duplicate name (admin)", async () => {
    const token = await tokenFor("admin");
    const body = { name: "Barfi", category: "Indian", price: 15, quantity: 20 };

    // first create
    await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    // attempt duplicate
    const res2 = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res2.status).toBe(409);
  });
});