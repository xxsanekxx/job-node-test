const INTERVALS = {
  per5Min: 5 * 60 * 1000,
  per15Min: 15 * 60 * 1000,
  perHalfHour: 30 * 60 * 1000,
  perHour: 60 * 60 * 1000,
  perHalfDay: 12 * 60 * 60 * 1000,
  perDay: 24 * 60 * 60 * 1000,
  perWeek: 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  getNextSchedulerTime(lastDate, intervalStr) {
    const tmpLastDate = (lastDate instanceof Date && lastDate) || new Date(lastDate);

    if (intervalStr === 'perMonth') {
      const month = tmpLastDate.getMonth();

      if (month > 10) {
        tmpLastDate.setFullYear(tmpLastDate.getFullYear() + 1, 0);
      } else {
        tmpLastDate.setMonth(month + 1);
      }

      return tmpLastDate;
    }

    return new Date(+tmpLastDate + (INTERVALS[intervalStr] || INTERVALS.perDay));
  },
  getMonthAgo() {
    const now = new Date();
    const month = now.getMonth();

    if (month === 0) {
      now.setFullYear(now.getFullYear() - 1, 11);
    } else {
      now.setMonth(month - 1);
    }

    return now;
  },
};
