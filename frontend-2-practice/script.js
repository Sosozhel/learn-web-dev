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

const today = new Date();
const state = {
  currentMonth: today.getMonth(),
  currentYear: today.getFullYear(),
  selectedDay: today.getDate(),
  selectedTime: '12:00'
};

const calendarTitle = document.querySelector('.calendar__month');
const calendarGrid = document.querySelector('.calendar__grid');
const calendarSection = document.querySelector('.calendar');
const slotsDate = document.querySelector('.slots__date');
const slotsList = document.querySelector('.slots__list');
const summaryValue = document.querySelector('.booking__summary-value');
const previousMonthButton = document.querySelector('[aria-label="Предыдущий месяц"]');
const nextMonthButton = document.querySelector('[aria-label="Следующий месяц"]');
const continueButton = document.querySelector('.button--primary');

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

function formatSelectedDate(day, month, year) {
  const date = new Date(year, month, day);
  const weekday = DAYS_OF_WEEK[date.getDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${day} ${MONTHS_GENITIVE[month]} ${year}`;
}

function renderCalendar() {
  calendarTitle.textContent = `${MONTHS_NOMINATIVE[state.currentMonth][0].toUpperCase()}${MONTHS_NOMINATIVE[state.currentMonth].slice(1)} ${state.currentYear}`;
  calendarGrid.setAttribute('aria-label', `Календарь на ${MONTHS_GENITIVE[state.currentMonth]} ${state.currentYear}`);

  const weekdays = WEEKDAYS_SHORT.map((weekday) =>
    `<span class="calendar__weekday" role="columnheader">${weekday}</span>`
  ).join('');
  const days = buildCalendarGrid(state.currentYear, state.currentMonth).flat().map((day) => {
    if (day === null) return '<span class="calendar__day calendar__day--outside" aria-hidden="true"></span>';

    const date = new Date(state.currentYear, state.currentMonth, day);
    const selectable = isDateSelectable(day, state.currentMonth, state.currentYear, today);
    const busy = selectable && BUSY_DAYS.includes(day);
    const selected = day === state.selectedDay;
    const classes = ['calendar__day'];
    if (!selectable) classes.push('calendar__day--disabled');
    if (busy) classes.push('calendar__day--busy');
    if (selected) classes.push('calendar__day--selected');
    const label = `${day} ${MONTHS_GENITIVE[state.currentMonth]}${busy ? ', нет свободных окон' : ''}${selected ? ', выбрано' : ''}`;
    const disabled = !selectable || busy;
    return `<button class="${classes.join(' ')}" type="button" role="gridcell" aria-label="${label}" aria-pressed="${selected}" data-day="${day}" ${disabled ? 'disabled' : ''}>${day}</button>`;
  }).join('');

  calendarGrid.innerHTML = weekdays + days;
  calendarGrid.querySelectorAll('button[data-day]').forEach((button) => {
    button.addEventListener('click', onDayClick);
  });
  calendarSection.querySelector('.calendar__note').hidden = !BUSY_DAYS.includes(state.selectedDay);
}

function renderTimeSlots() {
  const selectedDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
  slotsDate.textContent = `${state.selectedDay} ${MONTHS_GENITIVE[state.currentMonth]}, ${DAYS_OF_WEEK[selectedDate.getDay()]}`;
  const dateSeed = state.currentYear + state.currentMonth + state.selectedDay;
  const isBusyDay = BUSY_DAYS.includes(state.selectedDay);
  const slots = isBusyDay ? [] : TIMES.map((time, index) => ({
    time,
    busy: BUSY_TIMES.includes(time) || (index === dateSeed % TIMES.length && time !== state.selectedTime)
  }));

  if (isBusyDay) {
    slotsList.innerHTML = '<p class="slots__empty">На выбранную дату нет свободных окон</p>';
  } else {
    slotsList.innerHTML = slots.map(({ time, busy }) => {
      const selected = time === state.selectedTime && !busy;
      const classes = ['slots__item'];
      if (busy) classes.push('slots__item--busy');
      if (selected) classes.push('slots__item--selected');
      return `<button class="${classes.join(' ')}" type="button" data-time="${time}" aria-pressed="${selected}" ${busy ? 'disabled aria-label="' + time + ', занято"' : ''}>${busy ? `${time} · занято` : time}</button>`;
    }).join('');
    slotsList.querySelectorAll('button[data-time]').forEach((button) => {
      button.addEventListener('click', onTimeSlotClick);
    });
  }

  updateBottomBar();
}

function updateBottomBar() {
  summaryValue.textContent = `${formatSelectedDate(state.selectedDay, state.currentMonth, state.currentYear)} · ${state.selectedTime || 'время не выбрано'}`;
}

function onDayClick(event) {
  const day = Number(event.currentTarget.dataset.day);
  if (day === state.selectedDay) return;
  state.selectedDay = day;
  state.selectedTime = null;
  renderCalendar();
  renderTimeSlots();
}

function onTimeSlotClick(event) {
  state.selectedTime = event.currentTarget.dataset.time;
  renderTimeSlots();
}

function changeMonth(offset) {
  const nextMonth = new Date(state.currentYear, state.currentMonth + offset, 1);
  state.currentMonth = nextMonth.getMonth();
  state.currentYear = nextMonth.getFullYear();

  if (state.currentYear === today.getFullYear() && state.currentMonth === today.getMonth()) {
    state.selectedDay = today.getDate();
  } else {
    state.selectedDay = 1;
  }
  state.selectedTime = null;
  renderCalendar();
  renderTimeSlots();
}

function init() {
  previousMonthButton.addEventListener('click', () => changeMonth(-1));
  nextMonthButton.addEventListener('click', () => changeMonth(1));
  continueButton.addEventListener('click', () => {
    if (!state.selectedTime) {
      slotsDate.focus?.();
      return;
    }
    window.alert(`Запись выбрана: ${formatSelectedDate(state.selectedDay, state.currentMonth, state.currentYear)} · ${state.selectedTime}`);
  });
  renderCalendar();
  renderTimeSlots();
}

document.addEventListener('DOMContentLoaded', init);
