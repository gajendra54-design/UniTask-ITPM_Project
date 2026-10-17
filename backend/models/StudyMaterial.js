import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const studyMaterialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    sourceType: {
      type: String,
      enum: ["text", "pdf"],
      required: true,
    },
    flashcards: [flashcardSchema],
  },
  { timestamps: true }
);

const StudyMaterial = mongoose.model("StudyMaterial", studyMaterialSchema);

export default StudyMaterial;
