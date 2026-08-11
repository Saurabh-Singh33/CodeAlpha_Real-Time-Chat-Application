const Meeting = require('../models/Meeting');

// @desc    Get all meetings for a user
// @route   GET /api/meetings
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ user: req.user._id }).sort({ date: 1, time: 1 });
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a meeting
// @route   POST /api/meetings
const createMeeting = async (req, res) => {
  try {
    const { title, date, time, team } = req.body;
    
    if (!title || !date || !time) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const meeting = await Meeting.create({
      title,
      date,
      time,
      team,
      user: req.user._id
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a meeting
// @route   PUT /api/meetings/:id
const updateMeeting = async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (meeting.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a meeting
// @route   DELETE /api/meetings/:id
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (meeting.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await meeting.deleteOne();

    res.json({ success: true, message: 'Meeting removed' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
};
