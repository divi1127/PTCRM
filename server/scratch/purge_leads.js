const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const SportsPlace = require('../models/SportsPlace');
const ImportHistory = require('../models/ImportHistory');
require('dotenv').config({ path: '../.env' });

const purgeLeads = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const leadCount = await Lead.countDocuments();
    const placeCount = await SportsPlace.countDocuments();

    console.log(`Found ${leadCount} leads and ${placeCount} sports places.`);

    await Lead.deleteMany({});
    await SportsPlace.deleteMany({});
    await ImportHistory.deleteMany({});

    console.log('Successfully purged Lead, SportsPlace, and ImportHistory collections.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error purging leads:', err);
    process.exit(1);
  }
};

purgeLeads();
