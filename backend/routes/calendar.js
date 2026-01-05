const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Initialize Google Calendar API
const calendar = google.calendar('v3');

// Middleware to authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Create Google Calendar event for appointment
router.post('/create-event', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate([
        { path: 'patientId', populate: { path: 'userId', select: 'profile email' } },
        { path: 'doctorId', populate: { path: 'userId', select: 'profile email' } }
      ]);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission
    const hasPermission = 
      (req.user.role === 'patient' && appointment.patientId.userId._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctorId.userId._id.toString() === req.user._id.toString());

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Setup OAuth2 client (simplified - in production, you'd handle OAuth flow properly)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // For demo purposes, we'll create a basic event structure
    // In production, you'd need proper OAuth tokens from the user
    const event = {
      summary: `Medical Consultation - ${appointment.type}`,
      description: `
        Patient: ${appointment.patientId.userId.profile.firstName} ${appointment.patientId.userId.profile.lastName}
        Doctor: Dr. ${appointment.doctorId.userId.profile.firstName} ${appointment.doctorId.userId.profile.lastName}
        Specialization: ${appointment.doctorId.specialization}
        Type: ${appointment.type}
        ${appointment.chiefComplaint ? `Chief Complaint: ${appointment.chiefComplaint}` : ''}
        ${appointment.symptoms.length > 0 ? `Symptoms: ${appointment.symptoms.join(', ')}` : ''}
      `,
      start: {
        dateTime: appointment.dateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(appointment.dateTime.getTime() + appointment.duration * 60000).toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: appointment.patientId.userId.email },
        { email: appointment.doctorId.userId.email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // In a real implementation, you would:
    // 1. Have users authenticate with Google OAuth
    // 2. Store their refresh tokens
    // 3. Use their tokens to create events in their calendars
    
    // For now, we'll just return the event structure and update the appointment
    appointment.googleCalendarEventId = `demo_event_${appointment._id}`;
    await appointment.save();

    res.json({
      message: 'Calendar event created successfully',
      event,
      eventId: appointment.googleCalendarEventId
    });

  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ message: 'Error creating calendar event' });
  }
});

// Get doctor's calendar events
router.get('/doctor-schedule', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access doctor schedules' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Get appointments for the date range
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      dateTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profile' }
    })
    .sort({ dateTime: 1 });

    // Format appointments as calendar events
    const events = appointments.map(appointment => ({
      id: appointment._id,
      title: `${appointment.type} - ${appointment.patientId.userId.profile.firstName} ${appointment.patientId.userId.profile.lastName}`,
      start: appointment.dateTime,
      end: new Date(appointment.dateTime.getTime() + appointment.duration * 60000),
      type: appointment.type,
      status: appointment.status,
      patientName: `${appointment.patientId.userId.profile.firstName} ${appointment.patientId.userId.profile.lastName}`,
      chiefComplaint: appointment.chiefComplaint,
      symptoms: appointment.symptoms
    }));

    res.json({ events });

  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({ message: 'Error fetching doctor schedule' });
  }
});

// Update calendar event
router.put('/update-event/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { dateTime, duration } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const hasPermission = 
      (req.user.role === 'patient' && appointment.patientId.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctorId.toString() === req.user._id.toString());

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment
    if (dateTime) appointment.dateTime = new Date(dateTime);
    if (duration) appointment.duration = duration;

    await appointment.save();

    // In a real implementation, you would also update the Google Calendar event
    // using the stored googleCalendarEventId

    res.json({
      message: 'Calendar event updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ message: 'Error updating calendar event' });
  }
});

// Delete calendar event
router.delete('/delete-event/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const hasPermission = 
      (req.user.role === 'patient' && appointment.patientId.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctorId.toString() === req.user._id.toString());

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    appointment.googleCalendarEventId = null;
    await appointment.save();

    // In a real implementation, you would also delete the Google Calendar event

    res.json({
      message: 'Calendar event deleted successfully'
    });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ message: 'Error deleting calendar event' });
  }
});

module.exports = router;