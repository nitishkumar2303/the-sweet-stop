import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";

let mongoServer;

// beforeALl line runs before all the tests that are present in file...
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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


// i am checking if every details is not complete then if we get 400 
test("returns 400 if email or password is missing", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com" }); // no password

  expect(res.status).toBe(400);
});

// if Email not found the we get 401
test("returns 401 if user does not exist", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "notfound@test.com", password: "pass123" });

  expect(res.status).toBe(401);
});

// if  Wrong password then we get 401
test("returns 401 if password is incorrect", async () => {
  await User.create({
    name: "Nitish",
    email: "n@test.com",
    password: "CorrectPass",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "n@test.com", password: "WrongPass" });

  expect(res.status).toBe(401);
});

// if success then we get 200 + token
test("returns 200 and a JWT token on successful login", async () => {
  await User.create({
    name: "Nitish",
    email: "n@test.com",
    password: "Pass123!",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "n@test.com", password: "Pass123!" });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("token");
  expect(res.body).toHaveProperty("email", "n@test.com");
});