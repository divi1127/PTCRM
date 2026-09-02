const Lead   = require('../models/Lead');
const User   = require('../models/User');
const SportsPlace = require('../models/SportsPlace');
const logActivity = require('../utils/activityLogger');
const { notify, notifyAllAdmins } = require('../utils/notifHelper');

/* ─────────────────────────────────────────────────────────
   GET /api/leads    — paginated, filtered, searchable
───────────────────────────────────────────────────────── */
const getLeads = async (req, res) => {
  try {
    const {
      status, district, category, assignedTo, leadType,
      search, page = 1, limit = 100
    } = req.query;

    const filter = {};

    // Role gate — employees only see their own
    if (req.user.role === 'employee' || req.user.role === 'agent') {
      filter.assignedTo = req.user._id;
    }

    if (status)    filter.status   = status;
    if (district)  filter.district = district;
    if (category)  filter.category = category;
    if (assignedTo && req.user.role === 'admin') filter.assignedTo = assignedTo;

    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [
        { name:            re },
        { sportsPlaceName: re },
        { phone:           re },
        { district:        re },
        { category:        re },
        { 'location.address': re },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(500, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * pageSize;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: pageNum, pages: Math.ceil(total / pageSize), pageSize });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/leads
───────────────────────────────────────────────────────── */
const createLead = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.sportsPlaceName) body.sportsPlaceName = body.name;
    if (!body.assignedTo) body.assignedTo = req.user._id;
    body.createdBy = req.user._id;

    // Auto-assign a unique S.No (1, 2, 3 ... n) for every new lead
    const snoAgg = await Lead.aggregate([
      { $match: { sno: { $type: 'string', $ne: '' }, sno: { $regex: /^[0-9]+$/ } } },
      { $group: { _id: null, max: { $max: { $toLong: '$sno' } } } }
    ]).catch(() => []);
    const nextSno = (snoAgg[0] && snoAgg[0].max ? Number(snoAgg[0].max) : 0) + 1;
    body.sno = String(nextSno);

    // Check for duplicate lead by sportsPlaceId or phone / sno
    let existing = null;
    if (body.sportsPlaceId) {
      existing = await Lead.findOne({ sportsPlaceId: body.sportsPlaceId });
    }
    if (!existing && body.phone) {
      existing = await Lead.findOne({ phone: body.phone, sportsPlaceName: body.sportsPlaceName || body.name });
    }

    if (existing) {
      return res.status(400).json({ 
        message: 'Lead already exists for this location.',
        lead: existing 
      });
    }

    const lead = await Lead.create(body);
    await logActivity(req.user._id, 'Create Lead', `Created: ${lead.name} (${lead.district || 'no district'})`, lead._id, 'Lead');

    // Notify admins
    await notifyAllAdmins(
      'lead_created',
      '📋 New Lead Created',
      `Lead "${lead.sportsPlaceName || lead.name}" (${lead.district || 'No district'}) was created by ${req.user.name}.`,
      '/admin/leads'
    );

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   PUT /api/leads/:id
───────────────────────────────────────────────────────── */
const updateLead = async (req, res) => {
  try {
    const body = { ...req.body };
    const prevLead = await Lead.findById(req.params.id).select('assignedTo').lean();
    if (body.assignedTo === '') body.assignedTo = null;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id, body, { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    await logActivity(req.user._id, 'Update Lead', `Status → ${lead.status}`, lead._id, 'Lead');

    // Notify employee if assignment changed
    const prevId = prevLead?.assignedTo?.toString();
    const newId  = body.assignedTo?.toString();
    if (newId && newId !== prevId) {
      await notify(
        newId,
        'lead_assigned',
        'Lead Assigned to You',
        `A lead "${lead.sportsPlaceName || lead.name}" (${lead.district || ''}) has been assigned to you.`,
        '/employee/leads'
      );

      // Notify all admins about lead assignment
      await notifyAllAdmins(
        'lead_assigned',
        '📋 Lead Assigned',
        `Lead "${lead.sportsPlaceName || lead.name}" (${lead.district || ''}) has been assigned to an employee.`,
        '/admin/leads'
      );
    }

    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   DELETE /api/leads/:id
───────────────────────────────────────────────────────── */
const deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   DELETE /api/leads/delete-all
   CRITICAL: Admin only
───────────────────────────────────────────────────────── */
const deleteAllLeads = async (req, res) => {
  try {
    await Lead.deleteMany({});
    await logActivity(req.user._id, 'Delete All Leads', 'Emptied the entire lead database', null, 'Lead');
    res.json({ message: 'All leads deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/leads/:id/convert
───────────────────────────────────────────────────────── */
const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.status      = 'Converted';
    lead.convertedAt = new Date();
    await lead.save();
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/leads/stats
───────────────────────────────────────────────────────── */
const getLeadStats = async (req, res) => {
  try {
    const matchFilter = (req.user.role === 'employee' || req.user.role === 'agent')
      ? { assignedTo: req.user._id }
      : {};

    const [byStatus, bySource, byDistrict] = await Promise.all([
      Lead.aggregate([{ $match: matchFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $match: matchFilter }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $match: { ...matchFilter, district: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$district', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 38 },
      ]),
    ]);

    res.json({ byStatus, bySource, byDistrict });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/leads/districts  — distinct list for dropdown
───────────────────────────────────────────────────────── */
const getDistricts = async (req, res) => {
  try {
    const [leadDistricts, placeDistricts] = await Promise.all([
      Lead.distinct('district', { district: { $exists: true, $ne: null, $ne: '' } }),
      SportsPlace.distinct('district', { district: { $exists: true, $ne: null, $ne: '' } }),
    ]);
    const districts = Array.from(new Set([...(leadDistricts || []), ...(placeDistricts || [])]))
      .filter(Boolean)
      .sort();
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/leads/places/:district
───────────────────────────────────────────────────────── */
const getPlacesByDistrict = async (req, res) => {
  try {
    const [leadPlaces, sportsPlaces] = await Promise.all([
      Lead.find({ district: req.params.district })
        .select('sportsPlaceName name phone category location sno contactAvailability')
        .sort({ sno: 1 })
        .lean(),
      SportsPlace.find({ district: req.params.district })
        .select('name phone category address sno contactAvailability location')
        .sort({ sno: 1 })
        .lean(),
    ]);

    const merged = [];
    const seen = new Set();

    const addPlace = (item, source) => {
      const key = `${item.phone || ''}|${item.sno || ''}|${item.name || item.sportsPlaceName || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        _id: item._id,
        sportsPlaceName: item.sportsPlaceName || item.name,
        name: item.name || item.sportsPlaceName,
        phone: item.phone,
        category: item.category,
        sno: item.sno,
        location: { address: item.location?.address || item.address || '' },
        contactAvailability: item.contactAvailability || 'Yes',
        source,
      });
    };

    leadPlaces.forEach(p => addPlace(p, 'lead'));
    sportsPlaces.forEach(p => addPlace(p, 'master'));

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const [locations, existingLeads] = await Promise.all([
      SportsPlace.find({})
        .select('name district address phone category sno contactAvailability source googleMapsLink sourceField isVisited visitedBy visitedByName visitedAt location')
        .sort({ sno: 1, district: 1 })
        .lean(),
      Lead.find({})
        .select('sportsPlaceId name sportsPlaceName phone status contactPerson contactRole assignedTo createdAt')
        .lean()
    ]);

    // Build quick lookup map by sportsPlaceId, phone, and name
    const leadByPlaceId = new Map();
    const leadByPhone = new Map();

    existingLeads.forEach(l => {
      if (l.sportsPlaceId) leadByPlaceId.set(String(l.sportsPlaceId), l);
      if (l.phone) leadByPhone.set(`${l.phone.trim()}|${(l.sportsPlaceName || l.name || '').trim().toLowerCase()}`, l);
    });

    res.json(locations.map(loc => {
      const existing = leadByPlaceId.get(String(loc._id)) || leadByPhone.get(`${(loc.phone || '').trim()}|${(loc.name || '').trim().toLowerCase()}`);
      return {
        ...loc,
        displayAddress: loc.location?.address || loc.address || loc.name,
        existingLead: existing ? {
          _id: existing._id,
          status: existing.status,
          contactPerson: existing.contactPerson,
          createdAt: existing.createdAt
        } : null
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/leads/locations/:id/visit
───────────────────────────────────────────────────────── */
const markLocationVisited = async (req, res) => {
  try {
    const location = await SportsPlace.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    location.isVisited = true;
    location.visitedBy = req.user._id;
    location.visitedByName = req.user.name;
    location.visitedAt = new Date();
    await location.save();

    await logActivity(req.user._id, 'Mark Location Visited', `Visited location: ${location.name}`, location._id, 'SportsPlace');

    res.json({
      message: 'Location marked as visited',
      location: {
        _id: location._id,
        isVisited: true,
        visitedBy: location.visitedBy,
        visitedByName: location.visitedByName,
        visitedAt: location.visitedAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/leads/bulk-assign
───────────────────────────────────────────────────────── */
const bulkAssign = async (req, res) => {
  try {
    const { leadIds, district, employeeId } = req.body;
    const filter = {};
    if (leadIds?.length)  filter._id      = { $in: leadIds };
    else if (district)    filter.district = district;

    const result = await Lead.updateMany(filter, { assignedTo: employeeId });

    // Notify the assigned employee
    const employee = await User.findById(employeeId).select('name');
    if (employee) {
      const count = result.modifiedCount;
      const message = leadIds?.length 
        ? `${count} leads have been assigned to you.`
        : `${count} leads from ${district} district have been assigned to you.`;
      
      await notify(
        employeeId,
        'lead_assigned',
        '📋 Leads Assigned to You',
        message,
        '/employee/leads'
      );

      // Notify all admins about bulk assignment
      await notifyAllAdmins(
        'lead_assigned',
        '📋 Bulk Lead Assignment',
        `${count} leads have been assigned to ${employee.name}.`,
        '/admin/leads'
      );
    }

    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/leads/lookup/:sno
   Fetch from Master Data (SportsPlace) by Serial Number
───────────────────────────────────────────────────────── */
const getPlaceBySno = async (req, res) => {
  try {
    const place = await SportsPlace.findOne({ sno: req.params.sno });
    if (!place) return res.status(404).json({ message: 'No record found with that R.No' });
    res.json(place);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getLeads, createLead, updateLead, deleteLead, deleteAllLeads,
  convertLead, getLeadStats,
  getDistricts, getPlacesByDistrict, getAllLocations, markLocationVisited,
  bulkAssign, getPlaceBySno,
};
