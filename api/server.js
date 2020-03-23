const express = require('express');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { ApolloServer, UserInputError } = require('apollo-server-express');
const { Kind } = require('graphql/language');

const url = process.env.DB_URL || 'mongodb+srv://test:test@cluster0-ewxxo.mongodb.net/test';
let db;
let aboutMessage = 'Product Manager API v1.0';

async function productList() {
  const productsDB = await db.collection('products').find({}).toArray();
  return productsDB;
}
// const productsDB = [];
async function getNextSequence(name) {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { current: 1 } },
    { returnOriginal: false },
  );
  return result.value.current;
}
async function productAdd(_, { product }) {
  const newProduct = product;
  newProduct.id = await getNextSequence('products');
  const result = await db.collection('products').insertOne(product);
  const savedProduct = await db.collection('products')
    .findOne({ _id: result.insertedId });
  return savedProduct;
}


function setAboutMessage(_, { message }) {
  aboutMessage = message;
  return aboutMessage;
}
const resolvers = {
  Query: {
    about: () => aboutMessage,
    productList,
  },
  Mutation: {
    setAboutMessage,
    productAdd,
  },
};


// function productList() {
//     return productsDB;
// }

// function productAdd(_, { product }) {
//     product.id = productsDB.length + 1;
//     productsDB.push(product);
//     return product;
// }
async function connectToDb() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
}
const server = new ApolloServer({
  typeDefs: fs.readFileSync('schema.graphql', 'utf-8'),
  resolvers,
  formatError: (error) => {
    console.log(error);
    return error;
  },
});

const app = express();

// app.use(express.static('public'));

server.applyMiddleware({ app, path: '/graphql' });
const port = process.env.API_SERVER_PORT || 3000;
(async () => {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API Server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
})();
// app.listen(4000, function () {
//     console.log('App started on port 3000');
// });
