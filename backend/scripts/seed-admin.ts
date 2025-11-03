import { connectMongo } from '../src/config';
import UserModel from '../src/models/user';
import mongoose from 'mongoose';

function parseArgs() {
  const out: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split('=');
    const key = k.replace(/^--/, '');
    out[key] = v ?? 'true';
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const id = args.id;
  const role = (args.role || 'admin') as any;

  if (!email && !id) {
    console.error('Usage: pnpm -C backend run seed:admin -- --email=alice@example.com [--role=admin]');
    process.exit(1);
  }

  try {
    await connectMongo();

    let user = null;
    if (email) user = await UserModel.findOne({ email }).exec();
    if (!user && id) user = await UserModel.findById(id).exec();

    if (!user) {
      const displayName = email ? email.split('@')[0] : `admin-${Date.now()}`;
      user = await UserModel.create({ email: email ?? undefined, displayName, role });
      console.log('Created new user:', { id: user._id.toString(), email: user.email, role: user.role });
    } else {
      user.role = role;
      await user.save();
      console.log('Updated user role:', { id: user._id.toString(), email: user.email, role: user.role });
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exitCode = 2;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  }
}

void main();
