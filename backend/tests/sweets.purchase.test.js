// backend/tests/sweets.purchase.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import Sweet from "../src/models/Sweet.js";
import User from "../src/models/User.js";
import jwt from "jsonwebtoken";

let mongoServer;

// helper to create a real DB user & token
async function tokenFor(role = "user") {
  const email = `${Date.now()}@test.local`;
  const user = await User.create({ name: "T", email, password: "Pass123!", role });
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "testsecret");
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

describe("POST /api/sweets/:id/purchase - purchase sweet (decrease quantity)", () => {
  test("returns 401 if no token provided", async () => {
    const res = await request(app).post(`/api/sweets/${new mongoose.Types.ObjectId()}/purchase`);
    expect(res.status).toBe(401);
  });

  test("returns 404 if sweet not found", async () => {
    const token = await tokenFor("user");
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/sweets/${fakeId}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });

  test("returns 400 when insufficient stock", async () => {
    const token = await tokenFor("user");
    const sweet = await Sweet.create({ name: "Ladoo", category: "Indian", price: 10, quantity: 2 });

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(400);
  });

  test("defaults quantity to 1 when not provided and decreases quantity", async () => {
    const token = await tokenFor("user");
    const sweet = await Sweet.create({ name: "Barfi", category: "Indian", price: 30, quantity: 3 });

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({}); // no quantity provided

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("quantity", 2);

    const inDb = await Sweet.findById(sweet._id);
    expect(inDb.quantity).toBe(2);
  });

  test("works for purchasing multiple quantity and reduces correctly", async () => {
    const token = await tokenFor("user");
    const sweet = await Sweet.create({ name: "Kaju Katli", category: "Indian", price: 100, quantity: 10 });

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("quantity", 6);

    const inDb = await Sweet.findById(sweet._id);
    expect(inDb.quantity).toBe(6);
  });

  test("returns 400 for invalid purchase quantity (zero or negative)", async () => {
    const token = await tokenFor("user");
    const sweet = await Sweet.create({ name: "SweetX", category: "Misc", price: 5, quantity: 5 });

    const res1 = await request(app)
      .post(`/api/sweets/${sweet._id}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post(`/api/sweets/${sweet._id}/purchase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: -2 });
    expect(res2.status).toBe(400);
  });
});