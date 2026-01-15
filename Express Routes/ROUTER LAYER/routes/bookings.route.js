const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');

// GET /api/bookings - ดึงการจองทั้งหมด
router.get('/', authMiddleware, BookingController.getAllBookings);

// POST /api/bookings - สร้างการจองใหม่
router.post('/', authMiddleware, BookingController.createBooking);

// DELETE /api/bookings/:id - ยกเลิกการจอง
router.delete('/:id', authMiddleware, BookingController.cancelBooking);

module.exports = router;