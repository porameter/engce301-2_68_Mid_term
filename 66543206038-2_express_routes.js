// ===== ROUTER LAYER =====
// routes/bookings.route.js

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


// ===== CONTROLLER LAYER =====
// controllers/booking.controller.js

const BookingService = require('../services/booking.service');

class BookingController {
  static async createBooking(req, res) {
    try {
      // 1. รับข้อมูลจาก request
      const { room_id, booking_date, start_time, end_time, purpose } = req.body;
      const user_id = req.user.id; // จาก authMiddleware
      
      // 2. Validate input
      if (!room_id || !booking_date || !start_time || !end_time) {
        return res.status(400).json({ 
          error: 'Missing required fields' 
        });
      }
      
      // 3. เรียก Service
      const booking = await BookingService.createBooking({
        user_id,
        room_id,
        booking_date,
        start_time,
        end_time,
        purpose
      });
      
      // 4. ส่ง Response
      res.status(201).json(booking);
      
    } catch (error) {
      // Handle errors
      if (error.message === 'Room not available') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

module.exports = BookingController;


// ===== SERVICE LAYER =====
// services/booking.service.js

const BookingDB = require('../database/booking.db');
const RoomDB = require('../database/room.db');

class BookingService {
  static async createBooking(bookingData) {
    // 1. Validate business rules
    
    // ตรวจสอบว่าห้องมีอยู่จริง
    const room = await RoomDB.findById(bookingData.room_id);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // ตรวจสอบว่าห้องว่างในช่วงเวลานั้น
    const isAvailable = await this.checkRoomAvailability(
      bookingData.room_id,
      bookingData.booking_date,
      bookingData.start_time,
      bookingData.end_time
    );
    
    if (!isAvailable) {
      throw new Error('Room not available');
    }
    
    // ตรวจสอบเวลาเริ่มต้อง < เวลาสิ้นสุด
    if (bookingData.start_time >= bookingData.end_time) {
      throw new Error('Invalid time range');
    }
    
    // 2. สร้างการจอง
    const booking = await BookingDB.create({
      ...bookingData,
      status: 'pending'
    });
    
    return booking;
  }
  
  static async checkRoomAvailability(room_id, date, start_time, end_time) {
    // ตรวจสอบว่ามีการจองซ้อนเวลาหรือไม่
    const overlapping = await BookingDB.findOverlapping(
      room_id, date, start_time, end_time
    );
    
    return overlapping.length === 0;
  }
}

module.exports = BookingService;


// ===== DATABASE LAYER =====
// database/booking.db.js

const db = require('./connection');

class BookingDatabase {
  static async create(bookingData) {
    const sql = `
      INSERT INTO bookings 
      (user_id, room_id, booking_date, start_time, end_time, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          bookingData.user_id,
          bookingData.room_id,
          bookingData.booking_date,
          bookingData.start_time,
          bookingData.end_time,
          bookingData.purpose,
          bookingData.status
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...bookingData });
        }
      );
    });
  }
  
  static async findOverlapping(room_id, date, start_time, end_time) {
    const sql = `
      SELECT * FROM bookings
      WHERE room_id = ?
        AND booking_date = ?
        AND status != 'cancelled'
        AND (
          (start_time < ? AND end_time > ?)
          OR (start_time < ? AND end_time > ?)
          OR (start_time >= ? AND end_time <= ?)
        )
    `;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [room_id, date, end_time, start_time, 
                   end_time, start_time, start_time, end_time], 
             (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = BookingDatabase;