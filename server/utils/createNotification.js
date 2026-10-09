const Notification = require('../models/Notification');

async function createNotification({ app, recipient, actor, type, relatedResource, relatedType, project, message }) {
  if (!recipient || (actor && recipient.toString() === actor.toString())) return null;
  const notification = await Notification.create({ recipient, actor: actor || null, type, relatedResource, relatedType, project, message });
  const io = app?.get('io');
  if (io) {
    const populated = await notification.populate('actor', 'name profileImage');
    io.to(`user:${recipient}`).emit('notification:new', { notification: populated });
    return populated;
  }
  return notification;
}

module.exports = createNotification;
