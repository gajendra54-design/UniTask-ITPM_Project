import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const collection = db.collection('groups');

    console.log('Checking indexes on "groups" collection...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    const badIndex = indexes.find(idx => idx.name === 'inviteCode_1');

    if (badIndex) {
      console.log('Found "inviteCode_1" index. Dropping it to allow recreation with sparse: true...');
      await collection.dropIndex('inviteCode_1');
      console.log('Index dropped successfully.');
    } else {
      console.log('"inviteCode_1" index not found. No action needed.');
    }

    console.log('Done. Mongoose will recreate the index with the correct settings on the next server start.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
