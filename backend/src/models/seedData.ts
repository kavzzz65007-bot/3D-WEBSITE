import { User, Complaint, CampusSpotQR, NotificationItem } from '../types';
import bcrypt from 'bcryptjs';

const hashedPassword = bcrypt.hashSync('password123', 10);
const studentPassword = bcrypt.hashSync('student123', 10);
const adminPassword = bcrypt.hashSync('admin123', 10);
const techPassword = bcrypt.hashSync('tech123', 10);

export const initialUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Dr. Arthur Vance',
    email: 'admin@campus.edu',
    password: adminPassword,
    role: 'admin',
    department: 'Campus Estate & Infrastructure Command',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-student-1',
    name: 'Kavya Sharma',
    email: 'student@campus.edu',
    password: studentPassword,
    role: 'student',
    department: 'Computer Science & AI',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+91 91234 56789',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-student-2',
    name: 'Rohit Verma',
    email: 'rohit@campus.edu',
    password: studentPassword,
    role: 'student',
    department: 'Mechanical Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 92345 67890',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-tech-1',
    name: 'Rajesh Kumar',
    email: 'tech@campus.edu',
    password: techPassword,
    role: 'staff',
    department: 'Electrical Maintenance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 93456 78901',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-tech-2',
    name: 'Suresh Patel',
    email: 'suresh@campus.edu',
    password: techPassword,
    role: 'staff',
    department: 'Plumbing & Water Works',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 94567 89012',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  }
];

export const initialCampusSpots: CampusSpotQR[] = [
  {
    id: 'spot-1',
    code: 'QR-ENG-304',
    building: 'Engineering Block A',
    block: 'A',
    floor: '3rd Floor',
    room: 'Lab 304 (AI & IoT)',
    defaultCategory: 'Classroom & Labs'
  },
  {
    id: 'spot-2',
    code: 'QR-LIB-201',
    building: 'Central Library',
    block: 'West Wing',
    floor: '2nd Floor',
    room: 'Silent Reading Hall',
    defaultCategory: 'Infrastructure'
  },
  {
    id: 'spot-3',
    code: 'QR-SCI-102',
    building: 'Science Complex',
    block: 'Block B',
    floor: '1st Floor',
    room: 'Optics & Laser Lab 102',
    defaultCategory: 'Electrical'
  },
  {
    id: 'spot-4',
    code: 'QR-SAC-CAF',
    building: 'Student Activity Center',
    block: 'Main Hub',
    floor: 'Ground Floor',
    room: 'Cafeteria & Dining Plaza',
    defaultCategory: 'Cleanliness & Sanitation'
  },
  {
    id: 'spot-5',
    code: 'QR-HST-WTR',
    building: 'Hostel Block 4',
    block: 'South Wing',
    floor: 'Ground Floor',
    room: 'Common Water Purification Station',
    defaultCategory: 'Plumbing'
  },
  {
    id: 'spot-6',
    code: 'QR-AUD-AV1',
    building: 'Main Campus Auditorium',
    block: 'Auditorium Tower',
    floor: 'Mezzanine',
    room: 'AV & Acoustics Control Booth',
    defaultCategory: 'Internet & IT'
  }
];

export const initialComplaints: Complaint[] = [
  {
    id: 'comp-101',
    ticketNumber: 'FMC-8921',
    title: 'Exposed high-voltage wire sparking near Staircase B',
    description: 'During rain yesterday, the junction conduit cracked and wires are intermittently sparking right next to the handrail on the 2nd floor staircase. Serious hazard for students commuting between lectures.',
    category: 'Electrical',
    location: {
      building: 'Engineering Block A',
      block: 'Wing B',
      floor: '2nd Floor',
      room: 'Staircase Landing B2',
      areaDescription: 'Adjacent to Dean office corridor',
      latitude: 12.9716,
      longitude: 77.5946
    },
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    status: 'In Progress',
    priority: 'Critical',
    aiPriorityAnalysis: {
      priority: 'Critical',
      confidenceScore: 98,
      slaHours: 2,
      urgencySignals: ['Safety hazard: "sparking"', 'Safety hazard: "exposed wire"', 'High foot-traffic corridor'],
      suggestedDepartment: 'Campus Electrical Maintenance Wing',
      reasoning: 'AI detected acute life-safety risk involving electrical arcing in a primary student passage. Escalated to highest tier.'
    },
    assignedTo: {
      id: 'user-tech-1',
      name: 'Rajesh Kumar',
      department: 'Electrical Maintenance',
      phone: '+91 93456 78901'
    },
    upvotes: 24,
    upvotedBy: ['user-student-1', 'user-student-2'],
    createdBy: {
      id: 'user-student-1',
      name: 'Kavya Sharma',
      email: 'student@campus.edu',
      role: 'student'
    },
    timeline: [
      {
        id: 'tl-1',
        status: 'Submitted',
        note: 'Issue reported with high-resolution photo and GPS tag.',
        updatedBy: 'Kavya Sharma',
        updatedByRole: 'student',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-2',
        status: 'Under Review',
        note: 'AI classified as Critical Emergency (SLA: 2 hours). Automated alert sent to duty officer.',
        updatedBy: 'AI Dispatch Engine',
        updatedByRole: 'admin',
        timestamp: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-3',
        status: 'Assigned',
        note: 'Assigned to Senior Electrician Rajesh Kumar with emergency repair kit.',
        updatedBy: 'Dr. Arthur Vance',
        updatedByRole: 'admin',
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-4',
        status: 'In Progress',
        note: 'Technician on-site. Power isolated to circuit breaker B-12. Replacing conduit and weatherproof enclosure.',
        updatedBy: 'Rajesh Kumar',
        updatedByRole: 'staff',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ],
    comments: [
      {
        id: 'comm-1',
        userId: 'user-tech-1',
        userName: 'Rajesh Kumar',
        userRole: 'staff',
        text: 'Circuit isolated safely. Replacing the damaged MCB box now.',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'comp-102',
    ticketNumber: 'FMC-8922',
    title: 'Ceiling AC leaking water over AI Lab workstations',
    description: 'Unit 3 overhead cassette air conditioner is dripping directly over high-end GPU workstations in Lab 304. We had to cover two machines with plastic sheets.',
    category: 'Classroom & Labs',
    location: {
      building: 'Engineering Block A',
      block: 'A',
      floor: '3rd Floor',
      room: 'Lab 304 (AI & IoT)',
      qrCodeId: 'QR-ENG-304',
      latitude: 12.9718,
      longitude: 77.5948
    },
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    status: 'Assigned',
    priority: 'High',
    aiPriorityAnalysis: {
      priority: 'High',
      confidenceScore: 92,
      slaHours: 6,
      urgencySignals: ['High operational impact: "leaking water"', 'Critical academic/research facility area'],
      suggestedDepartment: 'Academic Facilities & Audio-Visual Support',
      reasoning: 'Active leak in high-value computer laboratory risks equipment damage and halts lab practical sessions.'
    },
    assignedTo: {
      id: 'user-tech-2',
      name: 'Suresh Patel',
      department: 'Plumbing & Water Works',
      phone: '+91 94567 89012'
    },
    upvotes: 18,
    upvotedBy: ['user-student-2'],
    createdBy: {
      id: 'user-student-2',
      name: 'Rohit Verma',
      email: 'rohit@campus.edu',
      role: 'student'
    },
    timeline: [
      {
        id: 'tl-10',
        status: 'Submitted',
        note: 'Reported via QR Scan inside Lab 304.',
        updatedBy: 'Rohit Verma',
        updatedByRole: 'student',
        timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-11',
        status: 'Assigned',
        note: 'Dispatched plumbing and HVAC drainage tech.',
        updatedBy: 'Dr. Arthur Vance',
        updatedByRole: 'admin',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ],
    comments: [],
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'comp-103',
    ticketNumber: 'FMC-8920',
    title: 'Purified water dispenser pump failure in Hostel Block 4',
    description: 'The cold and ambient drinking water dispensers on Ground Floor are displaying Error code E04 and not pumping water. Over 180 hostel residents have to go to Block 3 for drinking water.',
    category: 'Hostel & Mess',
    location: {
      building: 'Hostel Block 4',
      block: 'South Wing',
      floor: 'Ground Floor',
      room: 'Water Purification Station',
      qrCodeId: 'QR-HST-WTR'
    },
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    status: 'Resolved',
    priority: 'High',
    aiPriorityAnalysis: {
      priority: 'High',
      confidenceScore: 94,
      slaHours: 6,
      urgencySignals: ['High operational impact: "drinking water"', 'Large resident impact (180+ students)'],
      suggestedDepartment: 'Residential Life & Hostel Affairs Committee',
      reasoning: 'Essential residential utility disruption affecting hygiene and daily student sustenance.'
    },
    assignedTo: {
      id: 'user-tech-2',
      name: 'Suresh Patel',
      department: 'Plumbing & Water Works'
    },
    resolutionProof: {
      note: 'Replaced faulty high-pressure booster pump and flushed primary sediment filters. Tested TDS and water flow rate at 22 LPM. System operating within optimal health standards.',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
      resolvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      resolvedBy: 'Suresh Patel',
      satisfactionRating: 5
    },
    upvotes: 42,
    upvotedBy: ['user-student-1', 'user-student-2'],
    createdBy: {
      id: 'user-student-1',
      name: 'Kavya Sharma',
      email: 'student@campus.edu',
      role: 'student'
    },
    timeline: [
      {
        id: 'tl-20',
        status: 'Submitted',
        note: 'Issue reported with photo.',
        updatedBy: 'Kavya Sharma',
        updatedByRole: 'student',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-21',
        status: 'Assigned',
        note: 'Assigned to Suresh Patel.',
        updatedBy: 'Dr. Arthur Vance',
        updatedByRole: 'admin',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-22',
        status: 'In Progress',
        note: 'New commercial pump fitted.',
        updatedBy: 'Suresh Patel',
        updatedByRole: 'staff',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'tl-23',
        status: 'Resolved',
        note: 'Successfully restored. Verified by student committee.',
        updatedBy: 'Suresh Patel',
        updatedByRole: 'staff',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ],
    comments: [
      {
        id: 'comm-2',
        userId: 'user-student-1',
        userName: 'Kavya Sharma',
        userRole: 'student',
        text: 'Water flow is completely back to normal! Thanks for the prompt fix.',
        timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'comp-104',
    ticketNumber: 'FMC-8919',
    title: 'High-speed Wi-Fi Access Point offline in Central Library',
    description: 'AP-LIB-04 disconnected, leaving the north reading hall without campus intranet connectivity ahead of upcoming midterm exams.',
    category: 'Internet & IT',
    location: {
      building: 'Central Library',
      block: 'North Wing',
      floor: '2nd Floor',
      room: 'Silent Reading Hall',
      qrCodeId: 'QR-LIB-201'
    },
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    status: 'Submitted',
    priority: 'Medium',
    aiPriorityAnalysis: {
      priority: 'Medium',
      confidenceScore: 88,
      slaHours: 24,
      urgencySignals: ['Standard disruption: "wifi disconnected"', 'Critical academic/research facility area'],
      suggestedDepartment: 'IT Services & Network Infrastructure Team',
      reasoning: 'Redundant AP coverage partially active. Queued for PoE switch port reset.'
    },
    upvotes: 9,
    upvotedBy: [],
    createdBy: {
      id: 'user-student-2',
      name: 'Rohit Verma',
      email: 'rohit@campus.edu',
      role: 'student'
    },
    timeline: [
      {
        id: 'tl-30',
        status: 'Submitted',
        note: 'Complaint lodged with network zone metadata.',
        updatedBy: 'Rohit Verma',
        updatedByRole: 'student',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    comments: [],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-student-1',
    title: 'Resolution Completed! 🎉',
    message: 'Your complaint FMC-8920 (Water dispenser in Hostel Block 4) has been marked Resolved with proof photos.',
    type: 'success',
    complaintId: 'comp-103',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'user-student-1',
    title: 'Technician Dispatched',
    message: 'Senior Electrician Rajesh Kumar has begun on-site work on FMC-8921 (Sparking wire in Staircase B).',
    type: 'info',
    complaintId: 'comp-101',
    read: false,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-3',
    userId: 'user-admin-1',
    title: 'Critical Emergency Alert 🚨',
    message: 'AI Flagged high priority: Exposed sparking wire reported in Engineering Block A.',
    type: 'alert',
    complaintId: 'comp-101',
    read: true,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];
