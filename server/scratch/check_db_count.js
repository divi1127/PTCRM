const mongoose = require('mongoose');
const SportsPlace = require('../models/SportsPlace');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await SportsPlace.countDocuments({});
    console.log('Total SportsPlace in DB:', count);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};
run();
