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
