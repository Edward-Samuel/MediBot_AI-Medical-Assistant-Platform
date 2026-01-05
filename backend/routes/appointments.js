const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// Book appointment
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { doctorId, dateTime, type, symptoms, chiefComplaint } = req.body;

    // Validate required fields
    if (!doctorId || !dateTime || !type) {
      return res.status(400).json({ message: 'Doctor, date/time, and appointment type are required' });
    }

    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    // Find patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if appointment time is in the future
    const appointmentDate = new Date(dateTime);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({ message: 'Appointment must be scheduled for a future date' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      dateTime: {
        $gte: new Date(appointmentDate.getTime() - 30 * 60000), // 30 minutes before
        $lte: new Date(appointmentDate.getTime() + 30 * 60000)  // 30 minutes after
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ message: 'Time slot not available' });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      dateTime: appointmentDate,
      type,
      symptoms: symptoms || [],
      chiefComplaint,
      fee: {
        consultation: 0,
        additional: 0,
        total: 0
      }
    });

    await appointment.save();

    // Populate appointment details for response
    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'profile' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'profile' } }
    ]);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

// Get user appointments
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    let appointments;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }

      appointments = await Appointment.find({ patientId: patient._id })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'profile' }
        })
        .sort({ dateTime: -1 });

    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      appointments = await Appointment.find({ doctorId: doctor._id })
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'profile' }
        })
        .sort({ dateTime: -1 });
    }

    res.json({ appointments });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patientId', populate: { path: 'userId', select: 'profile' } },
        { path: 'doctorId', populate: { path: 'userId', select: 'profile' } }
      ]);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      (req.user.role === 'patient' && appointment.patientId.userId._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctorId.userId._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ appointment });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Error fetching appointment' });
  }
});

// Update appointment status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Patients can only cancel appointments
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Patients can only cancel appointments' });
      }
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: 'Appointment status updated', appointment });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Error updating appointment status' });
  }
});

// Add consultation notes (doctors only)
router.patch('/:id/notes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can add consultation notes' });
    }

    const { notes, diagnosis, prescription, followUpRequired, followUpDate } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment with consultation details
    appointment.notes = notes;
    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription || [];
    appointment.followUpRequired = followUpRequired || false;
    appointment.followUpDate = followUpDate ? new Date(followUpDate) : null;
    appointment.status = 'completed';

    await appointment.save();

    res.json({ message: 'Consultation notes added', appointment });

  } catch (error) {
    console.error('Add notes error:', error);
    res.status(500).json({ message: 'Error adding consultation notes' });
  }
});

// Get available time slots for a doctor
router.get('/doctor/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Check if doctor is available on this day
    const dayAvailability = doctor.availability[dayOfWeek];
    if (!dayAvailability || !dayAvailability.available) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctorId,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Generate available time slots
    const slots = generateTimeSlots(
      dayAvailability.start,
      dayAvailability.end,
      30, // 30-minute slots
      existingAppointments,
      requestedDate
    );

    res.json({ availableSlots: slots });

  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
});

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, duration, existingAppointments, date) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMinute, 0, 0);

  const current = new Date(start);
  const now = new Date();

  while (current < end) {
    // Skip past time slots
    if (current > now) {
      // Check if slot is available
      const isBooked = existingAppointments.some(apt => {
        const aptTime = new Date(apt.dateTime);
        return Math.abs(aptTime.getTime() - current.getTime()) < duration * 60000;
      });

      if (!isBooked) {
        slots.push({
          time: current.toTimeString().slice(0, 5),
          dateTime: new Date(current),
          available: true
        });
      }
    }

    current.setMinutes(current.getMinutes() + duration);
  }

  return slots;
}

module.exports = router;