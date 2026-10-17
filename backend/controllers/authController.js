import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import crypto from "crypto";
import { sendAuthEmail } from "../utils/emailService.js";
import {
  getWelcomeEmailTemplate,
  getPasswordResetTemplate,
  getPasswordResetSuccessTemplate,
} from "../utils/emailTemplates.js";

const TOKEN_EXPIRE_SECONDS = 60 * 60 * 24; // 1 day

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRE_SECONDS,
  });
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = generateToken(user._id);

    const htmlMessage = getWelcomeEmailTemplate(user.name);
    const textMessage = `Welcome to UniTask, ${user.name}!\n\nWe're absolutely thrilled to have you on board. UniTask is designed to help you organize your assignments, track priorities, and collaborate with your study groups effectively.\n\nTo get started, simply log in to your account.\n\nIf you have any questions or need assistance, our support team is always here to help.`;
    
    // await sendEmail({
    //   to: user.email,
    //   subject: "Welcome to UniTask!",
    //   html: htmlMessage,
    //   text: textMessage,
    // });

    await sendAuthEmail({
      to: user.email,
      subject: "Welcome to UniTask!",
      html: htmlMessage,
      text: textMessage,
    });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
      expiresIn: TOKEN_EXPIRE_SECONDS,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
      expiresIn: TOKEN_EXPIRE_SECONDS,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ message: "No user found with that email" });

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset url
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const htmlMessage = getPasswordResetTemplate(resetUrl);
    const textMessage = `Reset Your Password\n\nWe received a request to reset the password for your UniTask account. If you made this request, please go to the following link to choose a new password:\n\n${resetUrl}\n\nIf you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.`;

    try {
      // await sendEmail({
      //   to: user.email,
      //   subject: "Password Reset Request",
      //   html: htmlMessage,
      //   text: textMessage,
      // });

      await sendAuthEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: htmlMessage,
        text: textMessage,
      });
      res.status(200).json({ message: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid token or Token expired" });

    // Set new password
    // Ensure new password is not the same as the current password
    const isSamePassword = await bcrypt.compare(req.body.password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be the same as your current password" });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    const htmlMessage = getPasswordResetSuccessTemplate(user.name);
    const textMessage = `Password Reset Successful\n\nHi ${user.name},\n\nYour UniTask password has been successfully updated. You can now use your new password to log in to your account.\n\nIf you did not request this change, please contact our support team immediately to secure your account.`;
    
    // await sendEmail({
    //   to: user.email,
    //   subject: "Your Password Has Been Reset",
    //   html: htmlMessage,
    //   text: textMessage,
    // });

    await sendAuthEmail({
      to: user.email,
      subject: "Your Password Has Been Reset",
      html: htmlMessage,
      text: textMessage,
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      // Ensure new email isn't already used
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE PASSWORD
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isMatch) {
         return res.status(400).json({ message: "Incorrect current password" });
      }

      const isSamePassword = await bcrypt.compare(req.body.newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ message: "New password cannot be the same as your current password" });
      }

      user.password = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();

      res.status(200).json({ message: "Password successfully updated" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
