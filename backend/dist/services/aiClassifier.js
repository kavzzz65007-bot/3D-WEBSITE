"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyComplaint = classifyComplaint;
const CRITICAL_KEYWORDS = [
    'fire', 'spark', 'sparking', 'short circuit', 'flame', 'smoke', 'gas leak',
    'electric shock', 'exposed wire', 'chemical spill', 'lab hazard', 'collapse',
    'ceiling falling', 'elevator stuck', 'person trapped', 'flooding lab', 'emergency',
    'broken glass shard', 'security breach', 'intruder', 'water near switchboard'
];
const HIGH_KEYWORDS = [
    'flood', 'flooding', 'overflowing', 'burst pipe', 'blackout', 'power cut',
    'exam hall', 'exam tomorrow', 'server room', 'no water', 'lock broken',
    'door jammed', 'main server down', 'projector exam', 'drinking water contaminated',
    'ac breakdown lab', 'cctv failure', 'main gate lock', 'heavy leak'
];
const MEDIUM_KEYWORDS = [
    'not working', 'flickering', 'broken bench', 'projector blur', 'mic not working',
    'ac not cooling', 'fan noise', 'slow internet', 'wifi disconnected', 'tap leaking',
    'flush broken', 'door handle', 'window crack', 'whiteboard stained', 'chair broken',
    'ro water slow', 'trash overflow', 'dirty restroom'
];
const LOW_KEYWORDS = [
    'paint peeling', 'notice board', 'dusty', 'curtain rod', 'clock stopped',
    'bulb dim', 'squeaky door', 'cosmetic', 'minor scratch', 'suggestion',
    'plant pot', 'signboard faded'
];
const DEPARTMENT_MAP = {
    'Electrical': 'Campus Electrical Maintenance Wing',
    'Plumbing': 'Sanitation & Water Works Division',
    'Infrastructure': 'Civil Engineering & Campus Infrastructure',
    'Classroom & Labs': 'Academic Facilities & Audio-Visual Support',
    'Cleanliness & Sanitation': 'Campus Housekeeping & Hygiene Cell',
    'Internet & IT': 'IT Services & Network Infrastructure Team',
    'Safety & Security': 'Campus Safety, Security & Vigilance Unit',
    'Hostel & Mess': 'Residential Life & Hostel Affairs Committee',
    'Other': 'General Facility Operations'
};
function classifyComplaint(title, description, category, locationSummary) {
    const combinedText = `${title} ${description} ${locationSummary || ''}`.toLowerCase();
    const signalsFound = [];
    let criticalScore = 0;
    let highScore = 0;
    let mediumScore = 0;
    let lowScore = 0;
    // Check critical keywords
    for (const kw of CRITICAL_KEYWORDS) {
        if (combinedText.includes(kw)) {
            criticalScore += 3;
            signalsFound.push(`Safety hazard: "${kw}"`);
        }
    }
    // Check high keywords
    for (const kw of HIGH_KEYWORDS) {
        if (combinedText.includes(kw)) {
            highScore += 2;
            signalsFound.push(`High operational impact: "${kw}"`);
        }
    }
    // Check medium keywords
    for (const kw of MEDIUM_KEYWORDS) {
        if (combinedText.includes(kw)) {
            mediumScore += 1;
            signalsFound.push(`Standard disruption: "${kw}"`);
        }
    }
    // Check low keywords
    for (const kw of LOW_KEYWORDS) {
        if (combinedText.includes(kw)) {
            lowScore += 1;
            signalsFound.push(`Low impact detail: "${kw}"`);
        }
    }
    // Location sensitivity weighting
    if (combinedText.includes('lab') || combinedText.includes('exam') || combinedText.includes('library') || combinedText.includes('server')) {
        highScore += 1.5;
        signalsFound.push('Critical academic/research facility area');
    }
    let finalPriority = 'Medium';
    let slaHours = 24;
    let confidenceScore = 80;
    let reasoning = '';
    if (criticalScore > 0) {
        finalPriority = 'Critical';
        slaHours = 2; // immediate emergency response
        confidenceScore = Math.min(98, 85 + criticalScore * 4);
        reasoning = `AI flagged potential physical danger or severe facility risk (${signalsFound.slice(0, 3).join(', ')}). Immediate response protocol initiated.`;
    }
    else if (highScore >= 2 || (category === 'Safety & Security')) {
        finalPriority = 'High';
        slaHours = 6;
        confidenceScore = Math.min(95, 78 + highScore * 5);
        reasoning = `High disruption to academic or residential workflow detected. Requires expedited resolution within 6 hours.`;
    }
    else if (mediumScore >= 1 || (category === 'Electrical' || category === 'Plumbing' || category === 'Internet & IT')) {
        finalPriority = 'Medium';
        slaHours = 24;
        confidenceScore = Math.min(90, 72 + mediumScore * 4);
        reasoning = `Standard campus facility issue. Scheduled for maintenance queue with 24-hour target resolution.`;
    }
    else if (lowScore > 0) {
        finalPriority = 'Low';
        slaHours = 48;
        confidenceScore = Math.min(88, 70 + lowScore * 5);
        reasoning = `Non-blocking maintenance item or aesthetic request. Routed to routine batch inspection.`;
    }
    else {
        // Default fallback
        finalPriority = 'Medium';
        slaHours = 24;
        reasoning = 'Categorized under standard priority queue.';
        confidenceScore = 75;
    }
    const suggestedDepartment = DEPARTMENT_MAP[category] || DEPARTMENT_MAP['Other'];
    return {
        priority: finalPriority,
        confidenceScore: Math.round(confidenceScore),
        slaHours,
        urgencySignals: signalsFound.length > 0 ? signalsFound : ['Routine maintenance request'],
        suggestedDepartment,
        reasoning
    };
}
