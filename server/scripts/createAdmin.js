require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!process.env.MONGO_URI || !email) throw new Error('Set MONGO_URI and BOOTSTRAP_ADMIN_EMAIL for this one-time setup command.');
  await mongoose.connect(process.env.MONGO_URI);
  const existingAdmin = await User.exists({ role: 'admin' });
  if (existingAdmin) throw new Error('An administrator already exists; refusing to promote another account with this bootstrap script.');
  const user = await User.findOne({ email });
  if (!user) throw new Error('Create and verify the target account first, then rerun using its email.');
  user.role = 'admin'; user.isActive = true; await user.save();
  process.stdout.write(`Administrator role granted to ${user.email}. Remove BOOTSTRAP_ADMIN_EMAIL from the environment.\n`);
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });
