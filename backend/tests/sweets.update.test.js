// backend/tests/sweets.update.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import Sweet from "../src/models/Sweet.js";
import User from "../src/models/User.js";
import jwt from "jsonwebtoken";

let mongoServer;

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

// helper to create real user and return token
async function tokenFor(role = "user") {
  const email = `${Date.now()}@test.local`;
  const user = await User.create({
    name: "T",
    email,
    password: "Pass123!",
    role,
  });
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "testsecret"
  );
}

describe("PUT /api/sweets/:id - update sweet (admin only)", () => {
  test("returns 401 when no token provided", async () => {
    const res = await request(app)
      .put(`/api/sweets/${new mongoose.Types.ObjectId()}`)
      .send({ name: "X" });
    expect(res.status).toBe(401);
  });

  test("returns 403 when non-admin tries to update", async () => {
    const token = await tokenFor("user");
    const sweet = await Sweet.create({
      name: "A",
      category: "c",
      price: 10,
      quantity: 5,
    });

    const res = await request(app)
      .put(`/api/sweets/${sweet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A-new" });

    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid input (e.g., negative price)", async () => {
    const token = await tokenFor("admin");
    const sweet = await Sweet.create({
      name: "B",
      category: "c",
      price: 10,
      quantity: 5,
    });

    const res = await request(app)
      .put(`/api/sweets/${sweet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: -5 });

    expect(res.status).toBe(400);
  });

  test("returns 404 when sweet not found", async () => {
    const token = await tokenFor("admin");
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/api/sweets/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "NewName" });

    expect(res.status).toBe(404);
  });

  test("admin can update sweet and response contains updated fields (200)", async () => {
    const token = await tokenFor("admin");
    const sweet = await Sweet.create({
      name: "C",
      category: "c",
      price: 10,
      quantity: 5,
    });

    const res = await request(app)
      .put(`/api/sweets/${sweet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "C-updated", price: 15 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name", "C-updated");

    // DB was updated
    const updated = await Sweet.findById(sweet._id);
    expect(updated.name).toBe("C-updated");
    expect(updated.price).toBe(15);
  });

  test("admin can update unit and allow decimal quantity for non-piece units", async () => {
    const token = await tokenFor("admin");
    const sweet = await Sweet.create({
      name: "F",
      category: "c",
      price: 10,
      quantity: 5,
    });

    const res = await request(app)
      .put(`/api/sweets/${sweet._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ unit: "kg", quantity: 2.5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("unit", "kg");
    expect(res.body).toHaveProperty("quantity", 2.5);
  });

  test("returns 409 when updating name to one that already exists", async () => {
    const token = await tokenFor("admin");
    const s1 = await Sweet.create({
      name: "D",
      category: "c",
      price: 5,
      quantity: 2,
    });
    const s2 = await Sweet.create({
      name: "E",
      category: "c",
      price: 7,
      quantity: 3,
    });

    const res = await request(app)
      .put(`/api/sweets/${s2._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "D" }); // duplicate name

    expect(res.status).toBe(409);
  });
});
