# 📋 Changelog - Vocation

All notable changes to this project will be documented in this file.

---

## Version 2.0.0 - Major Feature Update

### 🎉 New Features

#### 1. **Career Discovery Quiz** 
- Added interactive multi-step questionnaire to help students discover careers that match their interests
- 8 comprehensive questions covering:
  - Interests and passions
  - Work environment preferences
  - Salary expectations
  - Education level willingness
  - Work-life balance priorities
  - Work type preferences
  - Team vs. independent work style
  - Career motivations
- Powered by Gemini AI for personalized career recommendations
- Displays 6-10 career matches with detailed information:
  - Career title and description
  - Match reasoning (why this career fits the user)
  - Salary ranges
  - Job outlook
  - Competitiveness level
- Direct integration: Click "View Career Pathway" from results to automatically generate pathway
- Accessible from pathway page subtitle link
- Smooth transitions and progress tracking throughout the quiz

#### 2. **Financial Tracker**
- Added comprehensive cost estimation for each pathway step
- Cost breakdown includes:
  - MDC Associate degrees: ~$7,200 (60 credits × $120/credit)
  - MDC Certificates: ~$3,000
  - MDC Bachelor's: ~$13,500 (remaining 60 credits after A.A./A.S.)
  - 4-year university transfer: ~$13,000 (2 years at public university)
  - Licensure exams: $175-$1,200 (varies by exam type)
- Features:
  - Total pathway cost summary with expandable breakdown
  - Individual step cost display in each flowchart card
  - Cost comparison across multiple career pathways
  - All costs clearly marked as estimates
  - Beautiful green-themed UI for financial information

#### 3. **Career Disambiguation System**
- Improved career input handling for broad terms (e.g., "nurse", "software", "mechanic")
- Shows 3-6 specific career options before pathway generation
- Each option includes:
  - Detailed description
  - Salary information
  - Job outlook
  - Competitiveness rating
- Prevents invalid inputs and guides users to specific career paths
- Enhanced API prompts to handle broad career categories intelligently

### ✨ Enhancements

#### User Experience
- Improved search bar animations with typewriter effect
- Added input validation with word/character limits (5 words or 50 characters)
- Real-time word/character counter with smooth fade transitions
- Enhanced error messaging with better visual feedback
- Smooth transitions between pathway steps and career options
- Improved loading states with Gemini-branded indicators
- Better visual hierarchy and spacing throughout the application

#### Pathway Display
- Full-width pathway display (removed container constraints)
- Better visual hierarchy and spacing
- Enhanced pathway card styling with cost information
- Improved responsive design for mobile devices
- Cleaner flowchart presentation

#### Navigation & Flow
- Streamlined pathway generation flow
- Auto-generation when coming from career discovery (seamless integration)
- Improved "Clear Pathway" functionality (refreshes to initial state)
- Better state management for pathway comparisons
- Consistent navigation patterns throughout the app

### 🐛 Bug Fixes

- Fixed issue where broad career terms were incorrectly marked as invalid
- Resolved input restoration after clearing pathway
- Fixed typewriter effect not retriggering after pathway clear
- Improved JSON parsing robustness for Gemini API responses
- Fixed pathway display appearing before career options
- Resolved animation timing issues with search bar fade-in/out
- Fixed cost calculation for various exam types
- Fixed search bar flash when selecting career from suggestions
- Improved URL parameter handling to prevent unwanted input restoration

### 🔧 Technical Improvements

- Added new API endpoint: `/api/career-assessment` for quiz functionality
- Enhanced `/api/get-career-suggestions` with better prompt handling and increased token limits
- Improved error handling and logging throughout the application
- Better state management for complex UI flows
- Optimized API calls and response parsing
- Added comprehensive cost calculation function
- Improved TypeScript type safety
- Better component organization and structure
- Enhanced code comments and documentation

### 📝 Code Quality

- Added comprehensive cost calculation function with detailed logic
- Improved TypeScript type safety across components
- Better component organization and structure
- Enhanced code comments and documentation
- Consistent code formatting and style

---

## Migration Notes

- No breaking changes for existing users
- All existing pathways continue to work as before
- New features are opt-in (career discovery quiz is accessible via link)
- Financial tracker automatically appears on all new pathway generations

---

## Known Limitations

- Cost estimates are approximations based on average tuition rates
- Actual costs may vary based on:
  - Residency status (in-state vs out-of-state)
  - Financial aid and scholarships
  - Program-specific fees
  - University choice for transfers
- Exam costs are estimates and may vary by state/region
- Career discovery quiz recommendations are AI-generated and should be used as guidance

---

**Release Date:** Novemeber 30 2025  
**Version:** 2.0.0  
**Build:** Production Ready

---

## Previous Versions

### Version 1.0.0 - Initial Release
- Basic pathway generation functionality
- MDC program integration
- Transfer pathway support
- Licensure exam information
- Pathway comparison feature

