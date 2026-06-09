const Campaign = require('../models/Campaign');
const FieldVisit = require('../models/FieldVisit');

// @desc Create campaign
const createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, launchedBy: req.user._id });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('launchedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update campaign
const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Field agent check-in
const checkIn = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const visit = await FieldVisit.create({
      agent: req.user._id,
      checkIn: { time: new Date(), lat, lng, address },
      status: 'checked-in',
    });
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Field agent check-out
const checkOut = async (req, res) => {
  try {
    const { lat, lng, address, notes, dailyReport } = req.body;
    // Find today's open visit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visit = await FieldVisit.findOne({
      agent: req.user._id,
      status: 'checked-in',
      createdAt: { $gte: today },
    });
    if (!visit) return res.status(404).json({ message: 'No active check-in found' });

    visit.checkOut = { time: new Date(), lat, lng, address };
    visit.status = 'checked-out';
    visit.notes = notes;
    visit.dailyReport = dailyReport;
    visit.reportSubmitted = true;
    await visit.save();
    res.json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all field visits
const getVisits = async (req, res) => {
  try {
    const { agentId, date } = req.query;
    const filter = {};
    if (agentId) filter.agent = agentId;
    if (req.user.role === 'agent') filter.agent = req.user._id;
    if (date) {
      const d = new Date(date);
      filter.createdAt = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    const visits = await FieldVisit.find(filter)
      .populate('agent', 'name email phone')
      .populate('lead', 'name phone')
      .sort({ createdAt: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCampaign, getCampaigns, updateCampaign, checkIn, checkOut, getVisits };
