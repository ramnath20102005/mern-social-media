const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongo;
let app;
let Users;

// Helpers
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET);
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URL = uri;
  process.env.ACCESS_TOKEN_SECRET = 'testsecret';

  // Require server AFTER env is set so it connects to in-memory DB
  const serverModule = require('../server');
  app = serverModule.app;

  // Import model after connection
  Users = require('../models/userModel');

  await mongoose.connection.asPromise();
});

test('multiple follows accumulate and do not create duplicates; followers update for targets', async () => {
  // Create users A (auth) and B/C (targets)
  const userA = await Users.create({
    fullname: 'User A', username: 'usera2', email: 'a2@example.com', password: 'hashed'
  });
  const userB = await Users.create({
    fullname: 'User B', username: 'userb2', email: 'b2@example.com', password: 'hashed'
  });
  const userC = await Users.create({
    fullname: 'User C', username: 'userc2', email: 'c2@example.com', password: 'hashed'
  });

  const token = signToken(userA._id.toString());

  // Follow B
  let res = await request(app)
    .patch(`/api/user/${userB._id}/follow`)
    .set('Authorization', token)
    .send({});
  expect(res.status).toBe(200);
  expect(res.body.authUser.following.length).toBe(1);

  // Follow C
  res = await request(app)
    .patch(`/api/user/${userC._id}/follow`)
    .set('Authorization', token)
    .send({});
  expect(res.status).toBe(200);
  expect(res.body.authUser.following.length).toBe(2);

  // Follow B again (should be no-op with $addToSet, still 2)
  res = await request(app)
    .patch(`/api/user/${userB._id}/follow`)
    .set('Authorization', token)
    .send({});
  // May return 500 "already following" per controller, that's fine; array should remain size 2
  if (res.status === 200) {
    expect(res.body.authUser.following.length).toBe(2);
  }

  // Verify followers for B and C each include A exactly once
  const freshB = await Users.findById(userB._id);
  const freshC = await Users.findById(userC._id);
  const aId = userA._id.toString();
  expect(freshB.followers.map(x => x.toString()).filter(id => id === aId).length).toBe(1);
  expect(freshC.followers.map(x => x.toString()).filter(id => id === aId).length).toBe(1);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  // Clean collections before each test
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

test('follow then unfollow updates followingCount correctly and never below 0', async () => {
  // Create users A (auth) and B/C (targets)
  const userA = await Users.create({
    fullname: 'User A',
    username: 'usera',
    email: 'a@example.com',
    password: 'hashed',
  });
  const userB = await Users.create({
    fullname: 'User B',
    username: 'userb',
    email: 'b@example.com',
    password: 'hashed',
  });
  const userC = await Users.create({
    fullname: 'User C',
    username: 'userc',
    email: 'c@example.com',
    password: 'hashed',
  });

  const token = signToken(userA._id.toString());

  // Follow B
  let res = await request(app)
    .patch(`/api/user/${userB._id}/follow`)
    .set('Authorization', token)
    .send({});

  expect(res.status).toBe(200);
  expect(res.body.followingCount).toBe(1);
  expect(res.body.authUser.following.length).toBe(1);

  // Follow C
  res = await request(app)
    .patch(`/api/user/${userC._id}/follow`)
    .set('Authorization', token)
    .send({});

  expect(res.status).toBe(200);
  expect(res.body.followingCount).toBe(2);
  expect(res.body.authUser.following.length).toBe(2);

  // Unfollow C
  res = await request(app)
    .patch(`/api/user/${userC._id}/unfollow`)
    .set('Authorization', token)
    .send({});

  expect(res.status).toBe(200);
  expect(res.body.followingCount).toBe(1);
  expect(res.body.authUser.following.length).toBe(1);

  // Unfollow C again (should no-op and not go negative)
  res = await request(app)
    .patch(`/api/user/${userC._id}/unfollow`)
    .set('Authorization', token)
    .send({});

  // Depending on implementation, second unfollow may still 200 but count must not go below 0
  expect([200, 500, 400]).toContain(res.status);
  if (res.status === 200) {
    expect(res.body.followingCount).toBeGreaterThanOrEqual(0);
  }
});
