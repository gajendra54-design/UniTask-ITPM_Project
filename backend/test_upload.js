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
    const FormData = (await import('form-data')).default;
    const fs = await import('fs');
    const form = new FormData();
    form.append('title', 'Test File Cloudinary');
    form.append('type', 'file');
    form.append('id', '69d0e4cf01d562a5669a32fe');

    
    // Create a dummy txt file
    fs.writeFileSync('dummy.txt', 'Hello Cloudinary');
    form.append('file', fs.createReadStream('dummy.txt'));

    const res = await axios.post('http://localhost:5000/api/resources/upload', form, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });
    console.log("Upload response:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Upload error:", err.response.status, err.response.data);
    } else {
      console.error("Network error:", err.message);
    }
  }
  mongoose.disconnect();
};
run();
