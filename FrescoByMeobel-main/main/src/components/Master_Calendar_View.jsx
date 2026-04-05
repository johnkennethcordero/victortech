"use client"

import { useState } from "react"
import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isToday from "dayjs/plugin/isToday"

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isToday)

const MasterCalendarView = ({ holidays, payrollPeriods, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [visibleMonths, setVisibleMonths] = useState(3)
  const [viewMode, setViewMode] = useState("year") // "year" or "month"

  const months = Array.from({ length: viewMode === "year" ? 12 : visibleMonths }, (_, i) => {
    return viewMode === "year"
      ? dayjs(currentDate).month(i).startOf("month")
      : dayjs(currentDate).add(i, "month").startOf("month")
  })

  const getDaysInMonth = (month) => {
    const daysInMonth = month.daysInMonth()
    return Array.from({ length: daysInMonth }, (_, i) => dayjs(month).date(i + 1))
  }

  const getHolidayForDate = (date) => {
    return holidays.find((holiday) => {
      const holidayDate = dayjs(holiday.date)
      return holidayDate.isValid() && holidayDate.isSame(date, "day")
    })
  }

  const getPayrollPeriodForDate = (date) => {
    return payrollPeriods.find((period) => {
      const startDate = dayjs(period.payroll_period_start)
      const endDate = dayjs(period.payroll_period_end)
      return (
        startDate.isValid() &&
        endDate.isValid() &&
        date.isSameOrAfter(startDate, "day") &&
        date.isSameOrBefore(endDate, "day")
      )
    })
  }

  const isWeekend = (date) => {
    const day = date.day()
    return day === 0 || day === 6
  }

  const goToPrevious = () => {
    if (viewMode === "year") {
      setCurrentDate(currentDate.subtract(1, "year"))
    } else {
      setCurrentDate(currentDate.subtract(visibleMonths, "month"))
    }
  }

  const goToNext = () => {
    if (viewMode === "year") {
      setCurrentDate(currentDate.add(1, "year"))
    } else {
      setCurrentDate(currentDate.add(visibleMonths, "month"))
    }
  }

  const goToCurrent = () => setCurrentDate(dayjs())

  const toggleViewMode = () => setViewMode(viewMode === "year" ? "month" : "year")

  const handleDateClick = (date) => onDateSelect(date.toDate())

  const renderDayCell = (day) => {
    const holiday = getHolidayForDate(day)
    const payrollPeriod = getPayrollPeriodForDate(day)
    const isPayrollPeriodDay = !!payrollPeriod
    const isWeekendDay = isWeekend(day)
    const isTodayDate = day.isToday()

    let cellClasses =
      "relative h-8 md:h-14 border border-gray-200 p-0.5 md:p-1 cursor-pointer transition-colors rounded-md"

    if (holiday) {
      cellClasses +=
        holiday.holiday_type === "regular" ? " bg-red-100 hover:bg-red-200" : " bg-blue-100 hover:bg-blue-200"
    } else if (isPayrollPeriodDay) {
      cellClasses += " bg-green-200 hover:bg-green-100"
    } else if (isWeekendDay) {
      cellClasses += " bg-gray-100 hover:bg-gray-200"
    } else {
      cellClasses += " hover:bg-gray-100"
    }

    if (isTodayDate) {
      cellClasses += " ring-2 ring-[#333333]"
    }

    return (
      <div key={day.format("YYYY-MM-DD")} className={cellClasses} onClick={() => handleDateClick(day)}>
        <div className="flex flex-col h-full">
          <span className="text-xs md:text-sm font-medium">{day.format("D")}</span>

          {/* Holiday label: hidden on mobile, visible on md+ */}
          {holiday && (
            <div className="mt-auto hidden md:block">
              <span
                className={`text-xs truncate block ${
                  holiday.holiday_type === "regular" ? "text-red-700" : "text-blue-700"
                }`}
                title={holiday.name}
              >
                {holiday.name}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMonth = (month) => {
    const days = getDaysInMonth(month)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const firstDayOfMonth = month.startOf("month").day()

    const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => (
      <div key={`empty-${i}`} className="h-8 md:h-14 border border-gray-200 bg-gray-50 rounded-md"></div>
    ))

    return (
      <div key={month.format("YYYY-MM")} className="mb-6 md:mb-8">
        <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2 text-[#333333]">
          {month.format("MMMM YYYY")}
        </h3>
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-6 md:h-8 flex items-center justify-center font-medium text-xs md:text-sm bg-gray-100 rounded-md"
            >
              {/* Abbreviated to 1 letter on mobile, 3 on md+ */}
              <span className="md:hidden">{day.charAt(0)}</span>
              <span className="hidden md:inline">{day}</span>
            </div>
          ))}
          {emptyCells}
          {days.map((day) => renderDayCell(day))}
        </div>
      </div>
    )
  }

  const handleVisibleMonthsChange = (e) => setVisibleMonths(Number.parseInt(e.target.value))

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-6">

      {/* Navigation */}
      <div className="flex flex-col items-center mb-4 gap-2 md:flex-row md:justify-between md:mb-6 md:gap-4">

        {/* Prev / Today / Next */}
        <div className="flex space-x-1 md:space-x-2">
          <button
            onClick={goToPrevious}
            className="px-2 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center md:px-4 md:py-2 md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5 md:h-5 md:w-5 md:mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {viewMode === "year" ? "Previous Year" : "Previous"}
          </button>
          <button
            onClick={goToCurrent}
            className="px-2 py-1 text-xs bg-black text-white rounded-md shadow-sm md:px-4 md:py-2 md:text-base"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-2 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center md:px-4 md:py-2 md:text-base"
          >
            {viewMode === "year" ? "Next Year" : "Next"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5 md:h-5 md:w-5 md:ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* View toggle + months selector */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleViewMode}
            className="px-2 py-1 text-xs bg-black text-white rounded-md shadow-sm md:px-4 md:py-2 md:text-base"
          >
            {viewMode === "year" ? "Switch to Month View" : "Switch to Year View"}
          </button>

          {viewMode === "month" && (
            <div className="flex items-center space-x-1 md:space-x-2">
              <label htmlFor="visibleMonths" className="text-xs md:text-sm">
                Months:
              </label>
              <select
                id="visibleMonths"
                value={visibleMonths}
                onChange={handleVisibleMonthsChange}
                className="border rounded-md p-0.5 text-xs shadow-sm md:p-1 md:text-sm"
              >
                <option value="1">1</option>
                <option value="3">3</option>
                <option value="6">6</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 p-2 bg-gray-50 rounded-lg shadow-sm md:mb-6 md:p-4">
        <div className="flex flex-wrap gap-2 md:gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 mr-1 rounded-md md:w-5 md:h-5 md:mr-2"></div>
            <span className="text-xs md:text-sm">Regular Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 mr-1 rounded-md md:w-5 md:h-5 md:mr-2"></div>
            <span className="text-xs md:text-sm">Special Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-50 border border-green-300 mr-1 rounded-md md:w-5 md:h-5 md:mr-2"></div>
            <span className="text-xs md:text-sm">Payroll Period</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 mr-1 rounded-md md:w-5 md:h-5 md:mr-2"></div>
            <span className="text-xs md:text-sm">Weekend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-gray-300 mr-1 ring-2 ring-[#5C7346] rounded-md md:w-5 md:h-5 md:mr-2"></div>
            <span className="text-xs md:text-sm">Today</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((month) => renderMonth(month))}
      </div>
    </div>
  )
}

export default MasterCalendarView