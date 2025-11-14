import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";

let mongoServer;

// beforeALl line runs before all the tests that are present in file...
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

//this makes sure that after each  test it drops the entire database i.e it removes all collections and documents
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

//this runs after all tests gets completed
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});


// i am checking if every details given then if we get 201 and user and email
test("registers a new user and responds with 201 and user email", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Nitish", email: "n@test.com", password: "Pass123!" });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("email", "n@test.com");

  // verify persisted in DB
  const user = await User.findOne({ email: "n@test.com" });
  expect(user).not.toBeNull();
  // password should be hashed (not equal to plain)
  expect(user.password).not.toBe("Pass123!");
});


//if name is missing return 400
test("returns 400 if name is missing", async () => {
  // send an empty body (missing name)
  const res = await request(app).post("/api/auth/register").send({
    email: "n@test.com",
    password: "Pass123",
  });
  expect(res.status).toBe(400);
});


//if email is missing return 400
test("returns 400 if email is missing", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Nitish", password: "Pass123!" });

  expect(res.status).toBe(400);
});


//if password is nissing return 400
test("returns 400 if password is missing", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Nitish", email: "n@test.com" });

  expect(res.status).toBe(400);
});
