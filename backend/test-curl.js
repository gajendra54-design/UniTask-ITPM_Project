import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import mongoose from 'mongoose';

dotenv.config();

const run = async () => {
  await connectDB();
  const user = await User.findOne();
  if (!user) {
    console.log("No user");
    return;
  }
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  try {
    const res = await axios.get('http://localhost:5000/api/skills-analysis/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Dashboard response:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Dashboard error:", err.response.status, err.response.data);
    } else {
      console.error("Network error:", err.message);
    }
  }
  mongoose.disconnect();
};
run();
