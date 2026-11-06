import Group from '../models/Group.js';
import Photo from '../models/Photo.js';

// Everyone who shares at least one group with this user, plus the user themself.
// One indexed query: distinct() returns each member id once across all my groups.
export async function getFriendIds(userId) {
  const ids = await Group.distinct('members', { members: userId });
  const set = new Set(ids.map(String));
  set.add(String(userId));
  return [...set];
}

// True if the photo exists and was uploaded by the user or one of their friends.
export async function canSeePhoto(userId, photoId) {
  const photo = await Photo.findById(photoId).select('uploader');
  if (!photo) return false;
  const friends = await getFriendIds(userId);
  return friends.includes(String(photo.uploader));
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
