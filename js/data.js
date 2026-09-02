/**
 * js/data.js
 * College Complaint Management System
 * Handles localStorage initialization, sample seed data, and CRUD operations.
 */

// Key for storing complaints in browser localStorage
const STORAGE_KEY = 'college_complaints_data';

// Standard categories specified in the project brief
const COMPLAINT_CATEGORIES = [
  'Academic',
  'Infrastructure',
  'Hostel',
  'Library',
  'Transport',
  'Canteen',
  'IT/Internet',
  'Administration',
  'Cleanliness',
  'Other'
];

// Status life-cycle definition
const COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

// Priority levels
const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Pre-seeded realistic demo complaints for testing and presentation
const SEED_COMPLAINTS = [
  {
    id: 'CMP-1001',
    studentName: 'Aarav Sharma',
    studentEmail: 'student@college.com',
    title: 'Wi-Fi connection drops in Hostel Block B',
    category: 'IT/Internet',
    department: 'Computer Science',
    location: 'Hostel Block B, 3rd Floor Rooms 301-310',
    priority: 'High',
    status: 'Pending',
    description: 'The Wi-Fi access point on the third floor of Hostel Block B disconnects every 10 minutes. Students are unable to access online study materials and submission portals.',
    adminResponse: '',
    createdAt: '2026-08-30T10:30:00.000Z',
    updatedAt: '2026-08-30T10:30:00.000Z'
  },
  {
    id: 'CMP-1002',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@college.com',
    title: 'Ceiling Projector Lamp Blown in Lecture Hall 304',
    category: 'Academic',
    department: 'Mechanical Engineering',
    location: 'Main Academic Block, Room 304',
    priority: 'Medium',
    status: 'In Progress',
    description: 'The multimedia projector in Hall 304 has a burnt out bulb. Morning lectures for semester 5 students are facing disruptions due to lack of presentation slides.',
    adminResponse: 'Work order #ENG-489 assigned to audio-visual maintenance team. Bulb replacement scheduled for today afternoon.',
    createdAt: '2026-08-29T14:15:00.000Z',
    updatedAt: '2026-08-31T09:45:00.000Z'
  },
  {
    id: 'CMP-1003',
    studentName: 'Rohan Verma',
    studentEmail: 'student@college.com',
    title: 'Drinking water dispenser leakage in Main Canteen',
    category: 'Canteen',
    department: 'Civil Engineering',
    location: 'Campus Canteen Ground Floor near Counter 2',
    priority: 'Low',
    status: 'Resolved',
    description: 'The RO drinking water dispenser tap is loose and leaking drinking water constantly across the floor, making the tile floor slippery and wasting purified water.',
    adminResponse: 'Plumber visited on Aug 30 and installed a brand-new valve faucet. Drain line inspected and cleared.',
    createdAt: '2026-08-28T09:00:00.000Z',
    updatedAt: '2026-08-30T16:00:00.000Z'
  },
  {
    id: 'CMP-1004',
    studentName: 'Ananya Gupta',
    studentEmail: 'ananya.gupta@college.com',
    title: 'Central Library Reference Hall AC not cooling',
    category: 'Library',
    department: 'Electronics Engineering',
    location: 'Central Library, 1st Floor Quiet Study Zone',
    priority: 'High',
    status: 'In Progress',
    description: 'Central air-conditioning unit 2 in the quiet study section is blowing warm air. High humidity and heat make it impossible to sit and study for competitive exams.',
    adminResponse: 'HVAC technician inspected the compressor. Refrigerant gas refill ordered from vendor. Will be functional within 24 hours.',
    createdAt: '2026-08-31T11:20:00.000Z',
    updatedAt: '2026-09-01T12:10:00.000Z'
  },
  {
    id: 'CMP-1005',
    studentName: 'Siddharth Rao',
    studentEmail: 'student@college.com',
    title: 'College Bus Route 12 arriving 45 mins late repeatedly',
    category: 'Transport',
    department: 'Information Technology',
    location: 'North City Route (Stops: Metro Gate 4, Green Park)',
    priority: 'Medium',
    status: 'Pending',
    description: 'Bus #12 driver consistently starts late from the depot, resulting in 40+ students reaching morning 9:00 AM labs late and receiving absence marks.',
    adminResponse: '',
    createdAt: '2026-09-01T18:40:00.000Z',
    updatedAt: '2026-09-01T18:40:00.000Z'
  }
];

/**
 * Initialize demo data in localStorage if it does not already exist.
 */
function initDemoData() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing || existing === '[]') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
    console.log('CollegeComplaint: Seeded initial demo complaints into localStorage.');
  }
}

/**
 * Retrieve all complaints from localStorage.
 * @returns {Array<Object>} List of complaint objects
 */
function getComplaints() {
  initDemoData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse complaints from localStorage', err);
    return [];
  }
}

/**
 * Persist the entire array of complaints back to localStorage.
 * @param {Array<Object>} complaints
 */
function saveComplaints(complaints) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.error('Failed to save complaints to localStorage', err);
  }
}

/**
 * Find a specific complaint by its unique ID (e.g. "CMP-1001").
 * @param {string} id
 * @returns {Object|null}
 */
function getComplaintById(id) {
  if (!id) return null;
  const list = getComplaints();
  return list.find(c => c.id.toUpperCase() === id.trim().toUpperCase()) || null;
}

/**
 * Generate next sequential Complaint ID (e.g. CMP-1006).
 * @returns {string}
 */
function generateNextComplaintId() {
  const list = getComplaints();
  let maxNumber = 1000;
  list.forEach(c => {
    if (c.id && c.id.startsWith('CMP-')) {
      const numPart = parseInt(c.id.replace('CMP-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  });
  return `CMP-${maxNumber + 1}`;
}

/**
 * Add a new complaint to localStorage.
 * @param {Object} data - Form data
 * @returns {Object} The saved complaint object with generated ID and timestamps
 */
function addComplaint(data) {
  const complaints = getComplaints();
  const now = new Date().toISOString();
  const newComplaint = {
    id: generateNextComplaintId(),
    studentName: data.studentName || 'Student User',
    studentEmail: data.studentEmail || 'student@college.com',
    title: data.title.trim(),
    category: data.category,
    department: data.department || 'General Academic',
    location: data.location ? data.location.trim() : 'Campus',
    priority: data.priority || 'Medium',
    status: 'Pending',
    description: data.description.trim(),
    adminResponse: '',
    createdAt: now,
    updatedAt: now
  };

  complaints.unshift(newComplaint); // Add at the beginning (most recent first)
  saveComplaints(complaints);
  return newComplaint;
}

/**
 * Update an existing complaint's status and/or admin response remarks.
 * @param {string} id
 * @param {Object} updateData - e.g. { status: 'In Progress', adminResponse: '...' }
 * @returns {Object|null} Updated complaint object
 */
function updateComplaint(id, updateData) {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id.toUpperCase() === id.trim().toUpperCase());
  if (index === -1) return null;

  const now = new Date().toISOString();
  complaints[index] = {
    ...complaints[index],
    ...updateData,
    updatedAt: now
  };

  saveComplaints(complaints);
  return complaints[index];
}

/**
 * Helper to reset localStorage back to the original demo seed data.
 */
function resetComplaintsData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
}

// Auto-run initialization when file loads
initDemoData();
