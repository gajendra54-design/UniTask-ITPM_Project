import connectDB from './config/db.js';
import { generateSkillsAnalysis } from './skills-analysis/services/skillsAnalysisService.js';
import User from './models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await connectDB();
  const users = await User.find();
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  for (const user of users) {
    try {
      const analysis = await generateSkillsAnalysis(user._id);
      console.log(`Success for ${user._id}`);
    } catch (err) {
      console.error(`CRASH for ${user._id}:`, err);
    }
  }
  mongoose.disconnect();
};
run();
