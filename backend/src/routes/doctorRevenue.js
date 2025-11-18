import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);
router.use(restrictTo('Doctor'));

// @desc    Get doctor's revenue data
// @route   GET /api/payments/doctor-revenue
// @access  Private (Doctor)
router.get('/doctor-revenue', async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all payments related to doctor's appointments
    const payments = await Payment.find({
      appointment: { $exists: true }
    })
      .populate({
        path: 'appointment',
        match: { doctor: doctorId },
        populate: {
          path: 'patient',
          select: 'user cardNumber',
          populate: {
            path: 'user',
            select: 'profile.firstName profile.lastName'
          }
        }
      })
      .sort({ paymentDate: -1 });

    // Filter out payments that don't belong to this doctor
    const doctorPayments = payments.filter(payment => payment.appointment);

    // Calculate revenue statistics
    const totalRevenue = doctorPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = doctorPayments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Weekly revenue (current week)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyRevenue = doctorPayments
      .filter(payment => new Date(payment.paymentDate) >= startOfWeek)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Daily revenue (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyRevenue = doctorPayments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= today && paymentDate < tomorrow;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Payment method breakdown
    const paymentMethods = doctorPayments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + (payment.amount || 0);
      return acc;
    }, {});

    // Revenue by month for the last 12 months
    const monthlyBreakdown = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = doctorPayments
        .filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      monthlyBreakdown.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        date: date.toISOString().split('T')[0]
      });
    }

    // Recent transactions
    const recentTransactions = doctorPayments.slice(0, 10).map(payment => ({
      id: payment._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      paymentDate: payment.paymentDate,
      patientName: payment.appointment?.patient?.user?.profile 
        ? `${payment.appointment.patient.user.profile.firstName} ${payment.appointment.patient.user.profile.lastName}`
        : 'Unknown Patient',
      appointmentId: payment.appointment?._id
    }));

    res.status(200).json({
      status: 'success',
      data: {
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          weekly: weeklyRevenue,
          daily: dailyRevenue
        },
        payments: doctorPayments,
        paymentMethods,
        monthlyBreakdown,
        recentTransactions,
        statistics: {
          totalTransactions: doctorPayments.length,
          averageTransactionValue: doctorPayments.length > 0 ? totalRevenue / doctorPayments.length : 0,
          successRate: doctorPayments.length > 0 
            ? (doctorPayments.filter(p => p.status === 'completed').length / doctorPayments.length) * 100 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor revenue:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor's appointment statistics
// @route   GET /api/doctors/me/appointment-stats
// @access  Private (Doctor)
router.get('/appointment-stats', async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'user cardNumber')
      .populate('patient.user', 'profile.firstName profile.lastName')
      .sort({ appointmentDate: -1 });

    // Calculate statistics
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDate).toDateString() === today
    );

    const pendingAppointments = appointments.filter(apt => 
      apt.status === 'Scheduled' || apt.status === 'Pending'
    );

    const completedAppointments = appointments.filter(apt => 
      apt.status === 'Completed'
    );

    const cancelledAppointments = appointments.filter(apt => 
      apt.status === 'Cancelled'
    );

    // Weekly appointments
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDate) >= startOfWeek
    );

    // Monthly appointments
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
    });

    // Appointment status breakdown
    const statusBreakdown = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    // Average appointment duration (if available)
    const appointmentsWithDuration = appointments.filter(apt => apt.duration);
    const averageDuration = appointmentsWithDuration.length > 0 
      ? appointmentsWithDuration.reduce((sum, apt) => sum + apt.duration, 0) / appointmentsWithDuration.length
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        total: appointments.length,
        today: todayAppointments.length,
        pending: pendingAppointments.length,
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        weekly: weeklyAppointments.length,
        monthly: monthlyAppointments.length,
        statusBreakdown,
        averageDuration,
        appointments: appointments.slice(0, 20) // Recent 20 appointments
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;

