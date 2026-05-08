// models/course.model.js
const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  time: { type: String, required: true }
});

const languageContentSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  pages: [pageSchema]
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    // Store all languages in a single object
    // ✅ REMOVED: Chinese (zh) and German (de)
    // ✅ ADDED: Hindi (hi) and Urdu (ur)
    languages: {
      en: languageContentSchema,   // English
      hi: languageContentSchema,   // Hindi (हिंदी)
      ur: languageContentSchema,   // Urdu (اردو)
      ar: languageContentSchema,   // Arabic (العربية)
      es: languageContentSchema    // Spanish (Español)
    },
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    isActive: { type: Boolean, default: true },
    // ✅ Updated: Only these 5 languages
    availableLanguages: [{
      type: String,
      enum: ['en', 'hi', 'ur', 'ar', 'es']
    }]
  },
  { timestamps: true }
);

// Pre-save middleware to update availableLanguages
courseSchema.pre('save', function(next) {
  this.availableLanguages = Object.keys(this.languages.toObject())
    .filter(lang => this.languages[lang] && this.languages[lang].courseName);
  next();
});

// Method to get course in specific language
courseSchema.methods.getLocalizedContent = function(language = 'en') {
  // If requested language exists and has content, use it
  if (this.languages[language] && this.languages[language].courseName) {
    return {
      id: this._id,
      courseName: this.languages[language].courseName,
      pages: this.languages[language].pages,
      availableLanguages: this.availableLanguages
    };
  }
  
  // Fallback to English
  return {
    id: this._id,
    courseName: this.languages.en?.courseName || 'Untitled',
    pages: this.languages.en?.pages || [],
    availableLanguages: this.availableLanguages
  };
};

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
