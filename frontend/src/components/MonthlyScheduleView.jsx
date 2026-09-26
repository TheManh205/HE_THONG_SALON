import React, { useState, useEffect } from 'react';
import { hairdresserAPI } from '../services/endpoints';
import { Modal } from './common/Modal';
import { useToast } from '../contexts/ToastContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from 'date-fns';

const Badge = ({ type, text }) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold';
  if (type === 'off') return <span className={`${base} bg-rose-500/20 text-rose-300 border border-rose-500/30`}>{text}</span>;
  if (type === 'morning') return <span className={`${base} bg-amber-500/10 text-amber-300 border border-amber-500/20`}>{text}</span>;
  return <span className={`${base} bg-emerald-500/10 text-emerald-300 border border-emerald-500/20`}>{text}</span>;
};

export const MonthlyScheduleView = ({ initialDate = new Date() }) => {
  const { addToast } = useToast();
  const [dateCursor, setDateCursor] = useState(initialDate);
  const [grid, setGrid] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateCursor]);

  const fetchData = async () => {
    try {
      const start = startOfWeek(startOfMonth(dateCursor), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(dateCursor), { weekStartsOn: 1 });
      // load hairdressers with schedules
      const res = await hairdresserAPI.getAll({ active_only: true });
      const hs = res.data || [];
      setHairdressers(hs);

      // Build a simple day-grid with which stylists have a schedule that day
      const days = [];
      let cursor = start;
      while (cursor <= end) {
        const dayEntry = { date: cursor, stylists: [] };
        hs.forEach((h) => {
          // prefer daily_schedules if available
          const daily = (h.daily_schedules || []).find((d) => d.schedule_date === format(cursor, 'yyyy-MM-dd'));
          if (daily) {
            if (!daily.is_day_off) dayEntry.stylists.push({ id: h.id, full_name: h.full_name, type: 'assigned' });
          } else {
            const sched = (h.schedules || []).find((s) => s.day_of_week === cursor.getDay() - 1 || s.day_of_week === (cursor.getDay() === 0 ? 6 : cursor.getDay() - 1));
            if (sched && !sched.is_day_off) dayEntry.stylists.push({ id: h.id, full_name: h.full_name, type: 'week' });
          }
        });
        days.push(dayEntry);
        cursor = addDays(cursor, 1);
      }
      setGrid(days);
    } catch (err) {
      addToast('Không thể tải lịch tháng', 'error');
    }
  };

  const openDayModal = (day) => {
    setSelectedDate(day.date);
    // prepare mapping of stylist id to presence
    const map = {};
    hairdressers.forEach((h) => {
      const has = (h.daily_schedules || []).some((d) => d.schedule_date === format(day.date, 'yyyy-MM-dd') && !d.is_day_off) || (h.schedules || []).some((s) => s.day_of_week === day.date.getDay() - 1 && !s.is_day_off);
      map[h.id] = has;
    });
    setSelectedDayData(map);
    setIsModalOpen(true);
  };

  const toggleStylistOnDate = (id) => {
    setSelectedDayData((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const saveDayAssignments = async () => {
    try {
      const scheduleDate = format(selectedDate, 'yyyy-MM-dd');
      // For each stylist, upsert daily schedule
      for (const h of hairdressers) {
        const present = !!selectedDayData[h.id];
        const payload = {
          day_of_week: 0,
          start_time: '08:30:00',
          end_time: '20:00:00',
          is_day_off: !present,
          schedule_date: scheduleDate
        };
        await hairdresserAPI.upsertDailySchedule(h.id, payload);
      }
      addToast('Lưu phân ca ngày thành công', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast('Không thể lưu phân ca', 'error');
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setDateCursor(subMonths(dateCursor, 1))} className="px-3 py-1 rounded bg-slate-800">‹</button>
        <div className="font-bold">{format(dateCursor, 'LLLL yyyy')}</div>
        <button onClick={() => setDateCursor(addMonths(dateCursor, 1))} className="px-3 py-1 rounded bg-slate-800">›</button>
      </div>
    </div>
  );

  return (
    <div>
      {renderHeader()}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['T2','T3','T4','T5','T6','T7','CN'].map((d) => (
          <div key={d} className="text-center font-bold text-slate-400 py-2">{d}</div>
        ))}

        {grid.map((g, idx) => (
          <div key={idx} className="p-2 rounded-lg border border-slate-700 min-h-20 bg-slate-900/40 cursor-pointer" onClick={() => openDayModal(g)}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold">{format(g.date, 'd')}</div>
              <div className="text-[11px] text-slate-400">{format(g.date, 'dd/MM')}</div>
            </div>
            <div className="space-y-1">
              {g.stylists.slice(0,3).map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-2">
                  <div className="truncate text-[12px]">{st.full_name}</div>
                  <Badge type={st.type === 'assigned' ? 'morning' : 'full'} text={st.type === 'assigned' ? 'Ngày' : 'Ca'} />
                </div>
              ))}
              {g.stylists.length > 3 && <div className="text-[11px] text-slate-400">+{g.stylists.length - 3} thêm</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Phân Ca Làm Việc Ngày ${selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}`}>
        <div className="space-y-3">
          {hairdressers.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-2 rounded border border-slate-700">
              <div>{h.full_name}</div>
              <div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!selectedDayData[h.id]} onChange={() => toggleStylistOnDate(h.id)} />
                  <span className="text-xs text-slate-400">Có ca</span>
                </label>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <button className="px-4 py-2 rounded bg-slate-800" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button className="px-4 py-2 rounded bg-salon-primary text-black font-bold" onClick={saveDayAssignments}>Lưu phân ca</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MonthlyScheduleView;
