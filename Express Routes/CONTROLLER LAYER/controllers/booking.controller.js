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
