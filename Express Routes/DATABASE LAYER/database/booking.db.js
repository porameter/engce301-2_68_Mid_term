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