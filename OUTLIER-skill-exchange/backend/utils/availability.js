// Do two availability lists share at least one overlapping slot on the same day?
const hasOverlap = (a = [], b = []) => {
  for (const x of a) {
    for (const y of b) {
      if (x.day && y.day && x.day.toLowerCase() === y.day.toLowerCase() &&
          x.startTime < y.endTime && x.endTime > y.startTime) {
        return true;
      }
    }
  }
  return false;
};

// Is a given Date inside any slot of an availability list?
const coversDate = (availability = [], date) => {
  const d = new Date(date);
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;
  return availability.some(s =>
    s.day && s.day.toLowerCase() === day.toLowerCase() && s.startTime <= time && s.endTime >= time);
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Next upcoming concrete Dates (ISO strings) from an availability list, e.g. for "pick another slot".
const nextSlots = (availability = [], count = 3, exclude) => {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 21 && out.length < count * 3; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    for (const s of availability) {
      if (!s.day || !s.startTime || s.day.toLowerCase() !== DAYS[day.getDay()].toLowerCase()) continue;
      const [h, m] = s.startTime.split(':').map(Number);
      const dt = new Date(day);
      dt.setHours(h, m || 0, 0, 0);
      if (dt > now && (!exclude || dt.getTime() !== new Date(exclude).getTime())) out.push(dt);
    }
  }
  return out.sort((a, b) => a - b).slice(0, count).map(d => d.toISOString());
};

module.exports = { hasOverlap, coversDate, nextSlots };
