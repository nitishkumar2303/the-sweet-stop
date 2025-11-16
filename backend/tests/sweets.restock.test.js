// backend/tests/sweets.restock.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import Sweet from "../src/models/Sweet.js";
import User from "../src/models/User.js";
import jwt from "jsonwebtoken";

let mongoServer;

// helper: create a real DB user & token (async)
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

describe("POST /api/sweets/:id/restock", () => {
  test("returns 401 if not logged in", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).post(`/api/sweets/${id}/restock`).send({ quantity: 10 });
    expect(res.status).toBe(401);
  });

  test("returns 403 if user is not admin", async () => {
    const sweet = await Sweet.create({
      name: "Ladoo",
      category: "Indian",
      price: 10,
      quantity: 5,
    });

    const token = await tokenFor("user"); // <-- await here

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(403);
  });

  test("returns 404 if sweet does not exist", async () => {
    const id = new mongoose.Types.ObjectId();
    const token = await tokenFor("admin"); // <-- await here

    const res = await request(app)
      .post(`/api/sweets/${id}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(404);
  });

  test("returns 400 if quantity is invalid (<=0)", async () => {
    const sweet = await Sweet.create({
      name: "Barfi",
      category: "Indian",
      price: 25,
      quantity: 10,
    });

    const token = await tokenFor("admin"); // <-- await here

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(400);
  });

  test("restocks sweet successfully for admin", async () => {
    const sweet = await Sweet.create({
      name: "Kaju Katli",
      category: "Indian",
      price: 100,
      quantity: 5,
    });

    const token = await tokenFor("admin"); // <-- await here

    const res = await request(app)
      .post(`/api/sweets/${sweet._id}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);
  });
});