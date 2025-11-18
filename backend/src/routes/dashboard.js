import express from 'express';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (Healthcare Manager)
router.get('/stats', protect, restrictTo('Healthcare Manager'), async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get total counts
    const [
      totalAppointments,
      totalPatients,
      totalDoctors,
      totalBills,
      totalRevenue,
      newPatientsThisMonth,
      completedAppointments,
      pendingAppointments
    ] = await Promise.all([
      Appointment.countDocuments(),
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Bill.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: { $in: ['Scheduled', 'Confirmed'] } })
    ]);

    // Calculate monthly growth
    const lastMonthPatients = await Patient.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const monthlyGrowth = lastMonthPatients > 0 ? 
      ((newPatientsThisMonth - lastMonthPatients) / lastMonthPatients) * 100 : 0;

    const stats = {
      totalAppointments,
      totalPatients,
      totalOperations: completedAppointments, // Using completed appointments as operations
      totalEarnings: totalRevenue[0]?.total || 0,
      newPatients: newPatientsThisMonth,
      completedAppointments,
      pendingAppointments,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
    };

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get dashboard analytics
// @route   GET /api/dashboard/analytics
// @access  Private (Healthcare Manager)
router.get('/analytics', protect, restrictTo('Healthcare Manager'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const filter = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Get appointment trends by month
    const appointmentTrends = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get patient registration trends
    const patientTrends = await Patient.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get revenue trends
    const revenueTrends = await Payment.aggregate([
      { $match: { ...filter, status: 'Success' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get department statistics
    const departmentStats = await Doctor.aggregate([
      {
        $group: {
          _id: '$department',
          doctorCount: { $sum: 1 },
          avgConsultationFee: { $avg: '$consultationFee' }
        }
      }
    ]);

    // Get appointment status distribution
    const appointmentStatusDistribution = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment method distribution
    const paymentMethodDistribution = await Payment.aggregate([
      { $match: { ...filter, status: 'Success' } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        appointmentTrends,
        patientTrends,
        revenueTrends,
        departmentStats,
        appointmentStatusDistribution,
        paymentMethodDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
