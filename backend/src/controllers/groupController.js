import Group from '../models/Group.js';

const me = (req) => req.user._id;
const withMembers = (q) => q.populate('members', 'name').populate('owner', 'name');

export async function listGroups(req, res) {
  const groups = await withMembers(Group.find({ members: me(req) }).sort({ createdAt: -1 }));
  res.json({ groups });
}

export async function createGroup(req, res) {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Group name is required.' });
  const group = await Group.create({ name, description: req.body.description || '', owner: me(req), members: [me(req)] });
  await group.populate([{ path: 'members', select: 'name' }, { path: 'owner', select: 'name' }]);
  res.status(201).json({ group });
}

// $addToSet is a single atomic database operation: if many friends join at the
// same moment they are all added, and a double-click never adds someone twice.
export async function joinGroup(req, res) {
  const code = req.body.inviteCode?.trim().toLowerCase();
  if (!code) return res.status(400).json({ message: 'Invite code is required.' });
  const group = await withMembers(Group.findOneAndUpdate({ inviteCode: code }, { $addToSet: { members: me(req) } }, { new: true }));
  if (!group) return res.status(404).json({ message: 'No group found with that invite code.' });
  res.json({ group });
}

export async function leaveGroup(req, res) {
  const group = await Group.findOne({ _id: req.params.id, members: me(req) });
  if (!group) return res.status(404).json({ message: 'Group not found.' });
  if (String(group.owner) === String(me(req))) return res.status(400).json({ message: 'The owner cannot leave. Delete the group instead.' });
  await Group.updateOne({ _id: group._id }, { $pull: { members: me(req) } });
  res.json({ message: 'You left the group.' });
}

export async function deleteGroup(req, res) {
  const result = await Group.deleteOne({ _id: req.params.id, owner: me(req) });
  if (result.deletedCount === 0) return res.status(403).json({ message: 'Only the group owner can delete it.' });
  res.json({ message: 'Group deleted.' });
}
