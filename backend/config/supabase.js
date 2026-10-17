import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExts = ['.exe', '.sh', '.bat', '.cmd', '.php'];
  
  if (blockedExts.includes(ext)) {
    return cb(new Error('Executable and script files are not allowed.'), false);
  }
  cb(null, true);
};

export const uploadToMemory = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter
});
