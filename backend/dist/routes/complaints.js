"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintsRouter = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../services/db");
const aiClassifier_1 = require("../services/aiClassifier");
const duplicateDetector_1 = require("../services/duplicateDetector");
const auth_1 = require("./auth");
const uuidv4 = () => crypto_1.default.randomUUID();
exports.complaintsRouter = (0, express_1.Router)();
// Generate readable ticket number like FMC-7821
function generateTicketNumber() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `FMC-${num}`;
}
// 1. Get all complaints with filtering & searching
exports.complaintsRouter.get('/', async (req, res) => {
    try {
        const { status, category, priority, search, myComplaints, userId } = req.query;
        let list = await (0, db_1.getAllComplaints)();
        if (status && status !== 'all') {
            list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
        }
        if (category && category !== 'all') {
            list = list.filter(c => c.category === category);
        }
        if (priority && priority !== 'all') {
            list = list.filter(c => c.priority === priority);
        }
        if (myComplaints === 'true' && userId) {
            list = list.filter(c => c.createdBy.id === userId);
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c => c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.ticketNumber.toLowerCase().includes(q) ||
                c.location.building.toLowerCase().includes(q) ||
                (c.location.room && c.location.room.toLowerCase().includes(q)));
        }
        return res.json({ complaints: list, total: list.length });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});
// 2. Live AI Pre-Check Duplicate (as user types)
exports.complaintsRouter.post('/check-duplicate', async (req, res) => {
    try {
        const { title, description, category, location } = req.body;
        if (!title) {
            return res.json({ isDuplicate: false, confidenceScore: 0, explanation: '' });
        }
        const all = await (0, db_1.getAllComplaints)();
        const result = (0, duplicateDetector_1.detectDuplicateComplaint)({
            title: title || '',
            description: description || '',
            category: category || 'Other',
            location: location || { building: '' }
        }, all);
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ error: 'Duplicate check failed' });
    }
});
// 3. Live AI Pre-Check Priority & Urgency Preview
exports.complaintsRouter.post('/check-priority', async (req, res) => {
    try {
        const { title, description, category, locationSummary } = req.body;
        const analysis = (0, aiClassifier_1.classifyComplaint)(title || '', description || '', category || 'Other', locationSummary || '');
        return res.json(analysis);
    }
    catch (err) {
        return res.status(500).json({ error: 'Priority classification failed' });
    }
});
// 4. Get complaint by ID
exports.complaintsRouter.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        return res.json({ complaint });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to retrieve complaint' });
    }
});
// 5. Create new complaint (Student or Staff)
exports.complaintsRouter.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title, description, category, location, imageUrl, priorityOverride } = req.body;
        if (!title || !description || !category || !location?.building) {
            return res.status(400).json({ error: 'Title, description, category, and building location are required' });
        }
        const currentUser = req.user;
        const all = await (0, db_1.getAllComplaints)();
        // 1. Run AI Priority Classifier
        const locSummary = `${location.building} ${location.block || ''} ${location.floor || ''} ${location.room || ''}`;
        const aiAnalysis = (0, aiClassifier_1.classifyComplaint)(title, description, category, locSummary);
        // 2. Run AI Duplicate Detector
        const duplicateResult = (0, duplicateDetector_1.detectDuplicateComplaint)({ title, description, category, location }, all);
        // Final priority: user or admin override if given, else AI predicted priority
        const finalPriority = priorityOverride || aiAnalysis.priority;
        const newComplaint = {
            id: `comp-${uuidv4()}`,
            ticketNumber: generateTicketNumber(),
            title: title.trim(),
            description: description.trim(),
            category: category,
            location: {
                building: location.building,
                block: location.block || '',
                floor: location.floor || '',
                room: location.room || '',
                areaDescription: location.areaDescription || '',
                latitude: location.latitude,
                longitude: location.longitude,
                qrCodeId: location.qrCodeId
            },
            imageUrl: imageUrl || undefined,
            status: 'Submitted',
            priority: finalPriority,
            aiPriorityAnalysis: aiAnalysis,
            aiDuplicateResult: duplicateResult,
            upvotes: 1,
            upvotedBy: [currentUser.id],
            createdBy: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role
            },
            timeline: [
                {
                    id: `tl-${uuidv4()}`,
                    status: 'Submitted',
                    note: `Issue submitted by ${currentUser.name}. AI routed to ${aiAnalysis.suggestedDepartment} (Target SLA: ${aiAnalysis.slaHours}h).`,
                    updatedBy: currentUser.name,
                    updatedByRole: currentUser.role,
                    timestamp: new Date().toISOString()
                }
            ],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const saved = await (0, db_1.createComplaint)(newComplaint);
        // Alert campus admins via notification
        const users = await (0, db_1.getUsers)();
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) {
            await (0, db_1.createNotification)({
                id: `notif-${uuidv4()}`,
                userId: admin.id,
                title: `New Ticket: ${saved.ticketNumber}`,
                message: `${saved.title} (${saved.priority}) reported at ${saved.location.building}.`,
                type: saved.priority === 'Critical' ? 'alert' : 'info',
                complaintId: saved.id,
                read: false,
                createdAt: new Date().toISOString()
            });
        }
        return res.status(201).json({
            message: 'Complaint submitted successfully',
            complaint: saved
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to submit complaint' });
    }
});
// 6. Upvote / Endorse ("Me Too")
exports.complaintsRouter.post('/:id/upvote', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const userId = req.user.id;
        const hasUpvoted = complaint.upvotedBy.includes(userId);
        let updatedUpvotedBy;
        let newUpvotesCount;
        if (hasUpvoted) {
            // Toggle off
            updatedUpvotedBy = complaint.upvotedBy.filter(id => id !== userId);
            newUpvotesCount = Math.max(0, complaint.upvotes - 1);
        }
        else {
            // Toggle on
            updatedUpvotedBy = [...complaint.upvotedBy, userId];
            newUpvotesCount = complaint.upvotes + 1;
        }
        const updated = await (0, db_1.updateComplaint)(complaint.id, {
            upvotes: newUpvotesCount,
            upvotedBy: updatedUpvotedBy
        });
        return res.json({
            message: hasUpvoted ? 'Upvote removed' : 'Upvote registered',
            upvotes: newUpvotesCount,
            hasUpvoted: !hasUpvoted
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to toggle upvote' });
    }
});
// 7. Update status (Submitted -> Under Review -> Assigned -> In Progress -> Resolved -> Closed)
exports.complaintsRouter.patch('/:id/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { status, note } = req.body;
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const currentUser = req.user;
        const newTimelineEntry = {
            id: `tl-${uuidv4()}`,
            status: status,
            note: note || `Status transitioned to "${status}" by ${currentUser.name}`,
            updatedBy: currentUser.name,
            updatedByRole: currentUser.role,
            timestamp: new Date().toISOString()
        };
        const updated = await (0, db_1.updateComplaint)(complaint.id, {
            status: status,
            timeline: [...complaint.timeline, newTimelineEntry]
        });
        // Notify the complaint creator
        await (0, db_1.createNotification)({
            id: `notif-${uuidv4()}`,
            userId: complaint.createdBy.id,
            title: `Status Update: ${complaint.ticketNumber}`,
            message: `Your report "${complaint.title}" is now ${status}. ${note || ''}`,
            type: status === 'Resolved' ? 'success' : 'info',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
        });
        return res.json({
            message: `Status updated to ${status}`,
            complaint: updated
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update status' });
    }
});
// 8. Assign technician (Admin feature)
exports.complaintsRouter.patch('/:id/assign', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { technicianId, technicianName, department, phone, note } = req.body;
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const currentUser = req.user;
        const newTimelineEntry = {
            id: `tl-${uuidv4()}`,
            status: 'Assigned',
            note: note || `Assigned to technician ${technicianName} (${department}) by ${currentUser.name}`,
            updatedBy: currentUser.name,
            updatedByRole: currentUser.role,
            timestamp: new Date().toISOString()
        };
        const updated = await (0, db_1.updateComplaint)(complaint.id, {
            status: 'Assigned',
            assignedTo: {
                id: technicianId,
                name: technicianName,
                department: department || 'Maintenance',
                phone
            },
            timeline: [...complaint.timeline, newTimelineEntry]
        });
        // Notify technician
        await (0, db_1.createNotification)({
            id: `notif-${uuidv4()}`,
            userId: technicianId,
            title: `New Assignment: ${complaint.ticketNumber}`,
            message: `You have been assigned to: ${complaint.title} at ${complaint.location.building}.`,
            type: 'warning',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
        });
        // Notify complaint owner
        await (0, db_1.createNotification)({
            id: `notif-${uuidv4()}`,
            userId: complaint.createdBy.id,
            title: `Technician Assigned`,
            message: `${technicianName} has been assigned to work on ticket ${complaint.ticketNumber}.`,
            type: 'info',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
        });
        return res.json({
            message: 'Technician assigned successfully',
            complaint: updated
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Assignment failed' });
    }
});
// 9. Resolve Complaint with Proof photo and notes
exports.complaintsRouter.post('/:id/resolve', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { note, imageUrl, satisfactionRating } = req.body;
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const currentUser = req.user;
        const resolutionProof = {
            note: note || 'Resolved and inspected by facility team.',
            imageUrl: imageUrl || undefined,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser.name,
            satisfactionRating: satisfactionRating || 5
        };
        const newTimelineEntry = {
            id: `tl-${uuidv4()}`,
            status: 'Resolved',
            note: `Issue resolved by ${currentUser.name}. Resolution note: ${resolutionProof.note}`,
            updatedBy: currentUser.name,
            updatedByRole: currentUser.role,
            timestamp: new Date().toISOString()
        };
        const updated = await (0, db_1.updateComplaint)(complaint.id, {
            status: 'Resolved',
            resolutionProof,
            timeline: [...complaint.timeline, newTimelineEntry]
        });
        // Notify student
        await (0, db_1.createNotification)({
            id: `notif-${uuidv4()}`,
            userId: complaint.createdBy.id,
            title: `Complaint Resolved! 🎉`,
            message: `Your issue ${complaint.ticketNumber} at ${complaint.location.building} has been resolved.`,
            type: 'success',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
        });
        return res.json({
            message: 'Complaint marked as resolved',
            complaint: updated
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to resolve complaint' });
    }
});
// 10. Add comment to discussion
exports.complaintsRouter.post('/:id/comments', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Comment text cannot be empty' });
        }
        const complaint = await (0, db_1.findComplaintById)(id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const currentUser = req.user;
        const newComment = {
            id: `comm-${uuidv4()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            text: text.trim(),
            timestamp: new Date().toISOString()
        };
        const updated = await (0, db_1.updateComplaint)(complaint.id, {
            comments: [...complaint.comments, newComment]
        });
        return res.json({
            message: 'Comment added',
            comment: newComment,
            complaint: updated
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to add comment' });
    }
});
