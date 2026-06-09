const Client = require('../models/Client');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({}).populate('employee', 'name email').sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, employee: req.user._id });
    res.status(201).json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteClient = async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getClients, createClient, updateClient, deleteClient };
