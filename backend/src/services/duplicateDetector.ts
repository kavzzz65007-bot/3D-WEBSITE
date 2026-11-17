import { Complaint, AIDuplicateCheckResult, ComplaintCategory, LocationInfo } from '../types';

/**
 * Tokenize string and remove stopwords
 */
function tokenize(text: string): Set<string> {
  const stopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of',
    'it', 'this', 'that', 'with', 'from', 'by', 'as', 'are', 'was', 'were', 'has', 'have',
    'my', 'our', 'room', 'floor', 'block', 'please', 'help', 'not', 'issue', 'problem'
  ]);
  
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
  );
}

/**
 * Jaccard similarity between two sets of tokens
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Normalize location string for fuzzy comparison
 */
function normalizeLoc(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectDuplicateComplaint(
  incoming: {
    title: string;
    description: string;
    category: ComplaintCategory;
    location: LocationInfo;
  },
  existingComplaints: Complaint[]
): AIDuplicateCheckResult {
  const incomingTokens = tokenize(`${incoming.title} ${incoming.description}`);
  const incBld = normalizeLoc(incoming.location.building);
  const incRoom = normalizeLoc(incoming.location.room);
  const incFloor = normalizeLoc(incoming.location.floor);

  let bestMatch: Complaint | null = null;
  let highestScore = 0;
  let matchRationale = '';

  // Only compare with active issues (or resolved within 24 hours)
  const activeComplaints = existingComplaints.filter(c => c.status !== 'Closed');

  for (const existing of activeComplaints) {
    // 1. Text similarity (0 to 1)
    const existingTokens = tokenize(`${existing.title} ${existing.description}`);
    const textSim = jaccardSimilarity(incomingTokens, existingTokens);

    // 2. Category match (0 or 1)
    const categoryMatch = incoming.category === existing.category ? 1.0 : 0.0;

    // 3. Location match (0 to 1)
    let locScore = 0;
    const exBld = normalizeLoc(existing.location.building);
    const exRoom = normalizeLoc(existing.location.room);
    const exFloor = normalizeLoc(existing.location.floor);

    if (incBld && exBld && (incBld.includes(exBld) || exBld.includes(incBld))) {
      locScore += 0.5; // Same building
      if (incRoom && exRoom && (incRoom === exRoom || incRoom.includes(exRoom) || exRoom.includes(incRoom))) {
        locScore += 0.5; // Same room
      } else if (incFloor && exFloor && incFloor === exFloor) {
        locScore += 0.3; // Same floor
      }
    }

    // Weighted composite score (0 to 100)
    // Text: 45%, Location: 35%, Category: 20%
    const compositeScore = (textSim * 45) + (locScore * 35) + (categoryMatch * 20);

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestMatch = existing;

      if (locScore >= 0.8 && textSim > 0.3) {
        matchRationale = `High probability duplicate: another complaint ("${existing.title}") has already been logged in the exact same location (${existing.location.building}, Room/Area ${existing.location.room || existing.location.floor || 'General'}).`;
      } else if (textSim > 0.6) {
        matchRationale = `Identical problem description detected matching ticket #${existing.ticketNumber}: "${existing.title}".`;
      } else {
        matchRationale = `Moderate overlap with ticket #${existing.ticketNumber} (${existing.title}).`;
      }
    }
  }

  const roundedScore = Math.round(highestScore);
  const isDuplicate = roundedScore >= 55 && bestMatch !== null;

  return {
    isDuplicate,
    confidenceScore: roundedScore,
    matchedComplaintId: isDuplicate && bestMatch ? bestMatch.id : undefined,
    matchedTitle: isDuplicate && bestMatch ? bestMatch.title : undefined,
    explanation: isDuplicate 
      ? matchRationale 
      : 'No duplicate complaints detected. This appears to be a unique campus issue.'
  };
}
