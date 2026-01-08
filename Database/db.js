const mongodb = require("mongodb")
const mongoose = require('mongoose');
const { MONGODB,SESSIONS } = require('../credentials');
const dbName = 'algo-backtester';
const uri = `mongodb+srv://${encodeURIComponent(MONGODB.user)}:${encodeURIComponent(MONGODB.login)}@${MONGODB.cluster}/${dbName}?retryWrites=true&w=majority`;


async function resetUsersCollection() {
  const db = mongoose.connection.db;
  const collectionName = 'users';
  // Check if the collection exists
  const exists = await db.listCollections({ name: collectionName }).toArray();
  if (exists.length > 0) {
    console.log(`Dropping existing ${collectionName} collection`);
    await db.dropCollection(collectionName);
  } else {
    console.log(`No existing ${collectionName} collection found`);
  }
  console.log(`Creating ${collectionName} with JSON Schema validation...`);
  // SERVER SIDE VALIDATION
  await db.createCollection(collectionName, {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "email", "hash", "salt"],
        additionalProperties: false,
        properties: {
          _id: {},

          name: {
            bsonType: "string",
            minLength: 2,
            maxLength: 100,
            description: "name must be a string between 2 and 100 characters and is required"
          },

          email: {
            bsonType: "string",
            pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            description: "email must be a valid email string and is required"
          },

          hash: {
            bsonType: "string",
            minLength: 3,
            description: "password hash must be a string and is required"
          },

          salt: {
            bsonType: "string",
            minLength: 1,
            description: "salt must be a string and is required"
          },

          createdAt: {
            bsonType: "date",
            description: "createdAt must be a date if present"
          },
          // Mongoose version key
          __v: {
            bsonType: ["int", "long", "double", "null"],
            description: "Mongoose version key"
          }
        }
      }
    }
  });
  console.log(`Created fresh ${collectionName} collection with server-side validation`);
}

async function connectDBAndResetUsers() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');
  await resetUsersCollection();
}

module.exports = {
  connectDBAndResetUsers,
  mongoose
};