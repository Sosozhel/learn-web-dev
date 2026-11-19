import { Fragment, useMemo, useState } from 'react';

const MONTHS_NOMINATIVE = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
const DAYS_OF_WEEK = [
  'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'
];
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const TIMES = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const BUSY_DAYS = [7, 15, 23];
const BUSY_TIMES = ['11:00', '15:00'];
const STEPS = [
  { number: '✓', label: 'Мастер', done: true },
  { number: '✓', label: 'Услуга', done: true },
  { number: '3', label: 'Дата и время', current: true },
  { number: '4', label: 'Контакты' },
  { number: '5', label: 'Подтверждение' }
];
const NAV_LINKS = ['Услуги', 'Мастера', 'Отзывы', 'Контакты'];

const today = new Date();
const initialDate = {
  month: today.getMonth(),
  year: today.getFullYear(),
  day: today.getDate()
};

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let day = 1;

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const cellIndex = weekIndex * 7 + weekday;
      if (cellIndex < mondayOffset || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
        day += 1;
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }
  return weeks;
}

function compareDates(date1, date2) {
  const first = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const second = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return first.getTime() - second.getTime();
}

function isDateSelectable(day, month, year, currentDate) {
  return compareDates(new Date(year, month, day), currentDate) >= 0;
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function formatSelectedDate(day, month, year) {
  const date = new Date(year, month, day);
  return `${capitalize(DAYS_OF_WEEK[date.getDay()])}, ${day} ${MONTHS_GENITIVE[month]} ${year}`;
}

function getSlots(year, month, day, selectedTime) {
  if (BUSY_DAYS.includes(day)) return [];
  const dateSeed = year + month + day;
  return TIMES.map((time, index) => ({
    time,
    busy: BUSY_TIMES.includes(time) || (index === dateSeed % TIMES.length && time !== selectedTime)
  }));
}

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Борода и Ножницы — главная">БОРОДА <span>&amp;</span> НОЖНИЦЫ</a>
      <nav className="site-nav" aria-label="Основная навигация">
        {NAV_LINKS.map((link) => <a className="site-nav__link" href={`#${link.toLowerCase()}`} key={link}>{link}</a>)}
      </nav>
    </header>
  );
}

function BookingSteps() {
  return (
    <nav className="steps" aria-label="Этапы записи">
      {STEPS.map((step, index) => (
          <Fragment key={step.label}>
            <span className={`steps__item${step.done ? ' steps__item--done' : ''}${step.current ? ' steps__item--current' : ''}`} aria-current={step.current ? 'step' : undefined}>
              <span className="steps__number">{step.number}</span>
              <span>{step.label}</span>
            </span>
            {index < STEPS.length - 1 && <span className="steps__line" aria-hidden="true" />}
          </Fragment>
      ))}
    </nav>
  );
}

function Calendar({ currentMonth, currentYear, selectedDay, onDaySelect, onMonthChange }) {
  const calendarWeeks = buildCalendarGrid(currentYear, currentMonth);
  const monthTitle = capitalize(MONTHS_NOMINATIVE[currentMonth]);
  const busyDay = BUSY_DAYS.includes(selectedDay);

  return (
    <section className="calendar" aria-labelledby="calendar-title">
      <div className="calendar__header">
        <h2 className="calendar__month" id="calendar-title">{monthTitle} {currentYear}</h2>
        <div className="calendar__controls">
          <button className="calendar__arrow" type="button" aria-label="Предыдущий месяц" onClick={() => onMonthChange(-1)}>‹</button>
          <button className="calendar__arrow" type="button" aria-label="Следующий месяц" onClick={() => onMonthChange(1)}>›</button>
        </div>
      </div>
      <div className="calendar__grid" role="grid" aria-label={`Календарь на ${MONTHS_GENITIVE[currentMonth]} ${currentYear}`}>
        {WEEKDAYS_SHORT.map((weekday) => <span className="calendar__weekday" role="columnheader" key={weekday}>{weekday}</span>)}
        {calendarWeeks.flatMap((week) => week).map((day, index) => {
          if (day === null) return <span className="calendar__day calendar__day--outside" aria-hidden="true" key={`empty-${index}`} />;
          const selectable = isDateSelectable(day, currentMonth, currentYear, today);
          const busy = selectable && BUSY_DAYS.includes(day);
          const selected = day === selectedDay;
          const classNames = [
            'calendar__day',
            !selectable && 'calendar__day--disabled',
            busy && 'calendar__day--busy',
            selected && 'calendar__day--selected'
          ].filter(Boolean).join(' ');
          const label = `${day} ${MONTHS_GENITIVE[currentMonth]}${busy ? ', нет свободных окон' : ''}${selected ? ', выбрано' : ''}`;
          return (
            <button
              className={classNames}
              type="button"
              role="gridcell"
              aria-label={label}
              aria-pressed={selected}
              disabled={!selectable || busy}
              onClick={() => onDaySelect(day)}
              key={day}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="calendar__note" hidden={!busyDay}>
        <span className="calendar__note-mark" aria-hidden="true" />
        На этот день нет свободных окон
      </p>
    </section>
  );
}

function TimeSlots({ currentYear, currentMonth, selectedDay, selectedTime, onTimeSelect }) {
  const selectedDate = new Date(currentYear, currentMonth, selectedDay);
  const slots = getSlots(currentYear, currentMonth, selectedDay, selectedTime);
  const isBusyDay = BUSY_DAYS.includes(selectedDay);

  return (
    <section className="slots" aria-labelledby="slots-title">
      <h2 className="slots__title" id="slots-title">Свободное время</h2>
      <p className="slots__date">{selectedDay} {MONTHS_GENITIVE[currentMonth]}, {DAYS_OF_WEEK[selectedDate.getDay()]}</p>
      <div className="slots__list" aria-label="Время записи">
        {isBusyDay ? (
          <p className="slots__empty">На выбранную дату нет свободных окон</p>
        ) : (
          slots.map(({ time, busy }) => (
            <button
              className={`slots__item${busy ? ' slots__item--busy' : ''}${time === selectedTime && !busy ? ' slots__item--selected' : ''}`}
              type="button"
              data-time={time}
              aria-pressed={time === selectedTime && !busy}
              disabled={busy}
              aria-label={busy ? `${time}, занято` : undefined}
              onClick={() => onTimeSelect(time)}
              key={time}
            >
              {busy ? `${time} · занято` : time}
            </button>
          ))
        )}
      </div>
      <p className="slots__legend"><span className="slots__legend-mark" aria-hidden="true" />Время занято</p>
    </section>
  );
}

function BookingFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__column"><h2>БОРОДА &amp; НОЖНИЦЫ</h2><p>Барбершоп для тех, кто ценит стиль</p></div>
        <div className="site-footer__column"><h2>КОНТАКТЫ</h2><p>ул. Садовая, 15, Москва</p><a href="tel:+74951234567">+7 (495) 123-45-67</a></div>
        <div className="site-footer__column"><h2>РЕЖИМ РАБОТЫ</h2><p>Пн–Пт: 9:00–21:00</p><p>Сб–Вс: 10:00–19:00</p></div>
      </div>
      <p className="site-footer__copyright">© 2026 Борода &amp; Ножницы. Все права защищены.</p>
    </footer>
  );
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(initialDate.month);
  const [currentYear, setCurrentYear] = useState(initialDate.year);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedTime, setSelectedTime] = useState('12:00');

  const summary = useMemo(
    () => `${formatSelectedDate(selectedDay, currentMonth, currentYear)} · ${selectedTime || 'время не выбрано'}`,
    [selectedDay, currentMonth, currentYear, selectedTime]
  );

  function handleDaySelect(day) {
    setSelectedDay(day);
    setSelectedTime(null);
  }

  function handleMonthChange(offset) {
    const nextMonth = new Date(currentYear, currentMonth + offset, 1);
    setCurrentMonth(nextMonth.getMonth());
    setCurrentYear(nextMonth.getFullYear());
    if (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() === today.getMonth()) {
      setSelectedDay(today.getDate());
    } else {
      setSelectedDay(1);
    }
    setSelectedTime(null);
  }

  function handleContinue() {
    if (!selectedTime) return;
    window.alert(`Запись выбрана: ${summary}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="booking">
        <BookingSteps />
        <div className="booking__heading">
          <h1 className="booking__title">Выберите дату и время</h1>
          <p className="booking__subtitle">Стрижка + борода · 90 мин · Шаг 3 из 5</p>
        </div>
        <div className="booking__choices">
          <Calendar
            currentMonth={currentMonth}
            currentYear={currentYear}
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
            onMonthChange={handleMonthChange}
          />
          <TimeSlots
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
        </div>
        <div className="booking__summary" aria-live="polite">
          <span className="booking__summary-label">Вы выбрали:</span>
          <strong className="booking__summary-value">{summary}</strong>
        </div>
        <div className="booking__actions">
          <a className="button button--secondary" href="#service">Назад</a>
          <button className="button button--primary" type="button" onClick={handleContinue}>Далее</button>
        </div>
      </main>
      <BookingFooter />
    </>
  );
}
