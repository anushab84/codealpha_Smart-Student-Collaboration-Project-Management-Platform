const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ProjectMeeting = require('../models/ProjectMeeting');
const { getProjectAccess } = require('../middleware/projectAccess');

const isConfigured = () => Boolean(process.env.JITSI_DOMAIN && process.env.JITSI_APP_ID && process.env.JITSI_APP_SECRET);
const safeDomain = () => {
  const domain = (process.env.JITSI_DOMAIN || '').toLowerCase().trim();
  return /^[a-z0-9.-]+(?::\d+)?$/.test(domain) ? domain : '';
};

exports.getMeeting = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    const meeting = await ProjectMeeting.findOne({ project: access.project._id, active: true }).populate('createdBy', 'name');
    res.json({ success: true, enabled: isConfigured() && Boolean(safeDomain()), meeting: meeting || null, domain: safeDomain() || null });
  } catch (error) { next(error); }
};

exports.startMeeting = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    if (!isConfigured() || !safeDomain()) return res.status(503).json({ success: false, message: 'Video meetings need JITSI_DOMAIN, JITSI_APP_ID, and JITSI_APP_SECRET configured on the backend and JWT authentication enabled by the Jitsi provider.' });
    let meeting = await ProjectMeeting.findOne({ project: access.project._id, active: true });
    if (!meeting) {
      try { meeting = await ProjectMeeting.create({ project: access.project._id, roomName: `collabhub-${crypto.randomBytes(18).toString('hex')}`, createdBy: req.user._id, active: true, startedAt: new Date() }); }
      catch (error) { if (error.code !== 11000) throw error; meeting = await ProjectMeeting.findOne({ project: access.project._id, active: true }); }
    }
    await meeting.populate('createdBy', 'name');
    res.status(201).json({ success: true, meeting, domain: safeDomain() });
  } catch (error) { next(error); }
};

exports.getMeetingToken = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    if (!isConfigured() || !safeDomain()) return res.status(503).json({ success: false, message: 'Video provider is not configured.' });
    const meeting = await ProjectMeeting.findOne({ _id: req.params.meetingId, project: access.project._id, active: true });
    if (!meeting) return res.status(404).json({ success: false, message: 'Active project meeting not found' });
    const token = jwt.sign({ aud: 'jitsi', iss: process.env.JITSI_APP_ID, sub: safeDomain(), room: meeting.roomName, context: { user: { id: req.user._id.toString(), name: req.user.name } } }, process.env.JITSI_APP_SECRET, { algorithm: 'HS256', expiresIn: '3m' });
    res.json({ success: true, token, domain: safeDomain(), roomName: meeting.roomName, expiresInSeconds: 180 });
  } catch (error) { next(error); }
};

exports.endMeeting = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    const meeting = await ProjectMeeting.findOne({ _id: req.params.meetingId, project: access.project._id, active: true });
    if (!meeting) return res.status(404).json({ success: false, message: 'Active project meeting not found' });
    if (!access.isOwner && meeting.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the meeting creator or project owner can end this meeting' });
    meeting.active = false; meeting.endedAt = new Date(); await meeting.save();
    res.json({ success: true, message: 'Meeting ended' });
  } catch (error) { next(error); }
};
