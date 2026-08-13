import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in .env');
    process.exit(1);
  }

  // Get arguments or fallback to defaults
  const email = (process.argv[2] || 'admin@propertypro.com').trim().toLowerCase();
  const password = process.argv[3] || 'Admin@123';

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const usersCollection = db.collection('users');

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      // Update their roles to ensure they have admin access
      await usersCollection.updateOne(
        { email },
        { $set: { roles: ['admin'], status: 'active', updatedAt: new Date() } }
      );
      console.log(`Updated existing user ${email} to be an active admin.`);
    } else {
      // Create user
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const now = new Date();
      
      const newUser = {
        email,
        passwordHash,
        roles: ['admin'],
        profile: {
          firstName: 'Super',
          lastName: 'Admin'
        },
        phone: '',
        familyMembers: [],
        status: 'active',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now
      };

      await usersCollection.insertOne(newUser);
      console.log(`Successfully created new SUPER_ADMIN user with email: ${email}`);
    }

  } catch (err) {
    console.error('Error executing admin creation script:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

main();
