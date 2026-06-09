require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Campaign = require('../models/Campaign');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing
  await User.deleteMany();
  await Lead.deleteMany();
  await Booking.deleteMany();
  await Product.deleteMany();
  await Campaign.deleteMany();

  // Create users
  const users = await User.create([
    { name: 'Admin User', email: 'admin@playtime.com', password: 'admin123', phone: '9000000002', role: 'admin' },
    { name: 'Employee Ravi', email: 'ravi@playtime.com', password: 'employee123', phone: '9000000003', role: 'employee' },
    { name: 'Employee Priya', email: 'priya@playtime.com', password: 'employee123', phone: '9000000004', role: 'employee' },
  ]);

  const [admin, emp1, emp2] = users;

  // Create leads
  await Lead.create([
    { name: 'Rahul Sharma', phone: '9111111111', email: 'rahul@test.com', source: 'web', status: 'New', assignedTo: emp1._id, sport: 'football', leadType: 'Online' },
    { name: 'Sunita Patel', phone: '9222222222', email: 'sunita@test.com', source: 'referral', status: 'Interested', assignedTo: emp1._id, sport: 'badminton', leadType: 'Online' },
    { name: 'Vikas Kumar', phone: '9333333333', email: 'vikas@test.com', source: 'field', status: 'Demo', assignedTo: emp2._id, sport: 'cricket', leadType: 'Offline' },
    { name: 'Anita Roy', phone: '9444444444', email: 'anita@test.com', source: 'social', status: 'Converted', assignedTo: emp2._id, sport: 'basketball', leadType: 'Online', convertedAt: new Date() },
    { name: 'Deepak Singh', phone: '9555555555', source: 'field', status: 'Rejected', assignedTo: emp1._id, sport: 'football', leadType: 'Offline' },
  ]);

  // Create bookings (repurposed or kept for legacy)
  const bookingDates = [new Date(), new Date(), new Date()];
  // Bookings logic could be removed if no longer used by Admin/Employee CRM focus
  // but keeping basic structure for now.
  await Booking.create([
    { user: admin._id, sport: 'football', venue: 'Main Arena', slot: { date: bookingDates[0], startTime: '10:00', endTime: '11:00' }, status: 'confirmed' }
  ]);

  // Create products
  await Product.create([
    { name: 'Football Pro X1', description: 'Professional match football', category: 'Balls', sport: 'football', price: 1299, stock: 50, images: [], rating: 4.5 },
    { name: 'Cricket Bat - Kashmir Willow', description: 'Lightweight Kashmir willow bat', category: 'Bats', sport: 'cricket', price: 2499, stock: 30, images: [], rating: 4.3 },
    { name: 'Badminton Racket Set', description: 'Aluminum frame racket set with 3 shuttles', category: 'Rackets', sport: 'badminton', price: 899, stock: 40, images: [], rating: 4.2 },
    { name: 'Basketball Size 7', description: 'Official size indoor/outdoor basketball', category: 'Balls', sport: 'basketball', price: 1599, stock: 25, images: [], rating: 4.4 },
    { name: 'Sports Kit Bag', description: 'Multi-sport waterproof kit bag 40L', category: 'Accessories', sport: 'general', price: 1999, stock: 60, images: [], rating: 4.6 },
    { name: 'Cricket Helmet', description: 'Safety approved cricket helmet', category: 'Protection', sport: 'cricket', price: 1799, stock: 20, images: [], rating: 4.1 },
    { name: 'Football Boots', description: 'Turf football boots size 6-11', category: 'Footwear', sport: 'football', price: 2999, stock: 35, images: [], rating: 4.7 },
    { name: 'Sports Water Bottle', description: '1L insulated sports bottle', category: 'Accessories', sport: 'general', price: 499, stock: 100, images: [], rating: 4.8 },
  ]);

  // Create campaigns
  await Campaign.create([
    { title: 'Weekend Football Fiesta', type: 'whatsapp', targetArea: 'Koramangala', targetSport: 'football', launchedBy: admin._id, status: 'active', budget: 5000, reach: 2400, conversions: 48 },
    { title: 'Badminton Morning Blast', type: 'sms', targetArea: 'HSR Layout', targetSport: 'badminton', launchedBy: admin._id, status: 'completed', budget: 3000, reach: 1800, conversions: 35 },
    { title: 'Cricket Season Special', type: 'email', targetArea: 'Indiranagar', targetSport: 'cricket', launchedBy: admin._id, status: 'draft', budget: 8000, reach: 0, conversions: 0 },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:    admin@playtime.com / admin123');
  console.log('  Employee: ravi@playtime.com  / employee123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
