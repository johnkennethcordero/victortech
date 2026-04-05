"use client"

import { useState, useEffect, useRef } from "react"
import Calendar from "./Calendar"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

// Custom dropdown to prevent native select overflow on mobile
const CustomSelect = ({ value, onChange, options, placeholder, required }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] bg-white md:px-3 md:py-2 md:text-sm ${
          !value ? "text-gray-400" : "text-gray-900"
        } border-gray-300`}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform text-gray-500 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`px-3 py-2 text-xs cursor-pointer hover:bg-[#5C7346] hover:text-white transition-colors md:text-sm ${
                value === option.value ? "bg-[#5C7346] text-white font-medium" : "text-gray-800"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddEmployee({ isOpen, onClose, onAdd }) {
  const FormState = {
    employee_number: "",
    first_name: "",
    last_name: "",
    position: "",
    address: "",
    hire_date: "",
    birth_date: "",
    marital_status: "",
    other_info: "",
    profile_picture: null,
    active: true,
    role: "",
    email: "",
    password: "",
  }

  const [formData, setFormData] = useState(FormState)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const resetForm = () => {
    setFormData(FormState)
    setError("")
    setPreviewImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const birthDate = new Date(formData.birth_date)
      if (birthDate >= today) throw new Error("Birth date cannot be today or a future date")

      const hireDate = new Date(formData.hire_date)
      if (hireDate > today) throw new Error("Hire date cannot be a future date")

      const accessToken = localStorage.getItem("access_token")
      const formDataToSend = new FormData()

      Object.keys(formData).forEach((key) => {
        if (key === "profile_picture" && formData[key]) {
          formDataToSend.append(key, formData[key])
        } else if (key === "employee_number") {
          formDataToSend.append(key, Number.parseInt(formData[key]))
        } else if (key === "active") {
          formDataToSend.append(key, String(formData[key]))
        } else if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/employment-info/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formDataToSend,
      })

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Server response: ${responseText}`)
      }

      if (!response.ok) {
        if (typeof data === "object") {
          const errorMessages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("\n")
          throw new Error(errorMessages)
        } else if (data.detail) {
          throw new Error(data.detail)
        } else {
          throw new Error("Failed to create employee. Please check the form and try again.")
        }
      }

      onAdd(data)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding employee:", error)
      setError(error.message || "Failed to add employee. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === "file") {
      if (files && files[0]) {
        setPreviewImage(URL.createObjectURL(files[0]))
        setFormData((prev) => ({ ...prev, [name]: files[0] }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }))

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const today = dayjs().format("YYYY-MM-DD")

  const roleOptions = [
    { value: "", label: "Select Role" },
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "employee", label: "Employee" },
  ]

  const maritalOptions = [
    { value: "", label: "Select Status" },
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "widowed", label: "Widowed" },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-4 md:p-8 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">

        <h2 className="text-l md:text-xl font-bold mb-4 md:mb-6">Add New Employee</h2>

        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-xs md:text-sm whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

          {/* User Information */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-sm md:text-lg font-semibold border-b pb-2">User Information</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Role*</label>
                <CustomSelect
                  value={formData.role}
                  onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                  options={roleOptions}
                  placeholder="Select Role"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Password*</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Basic Employment Information */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-sm md:text-lg font-semibold border-b pb-2">Basic Employment Information</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Employee Number*</label>
                <input
                  type="number"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">First Name*</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Last Name*</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Position*</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Address*</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-3 md:py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Hire Date*</label>
                <Calendar
                  label="Hire Date"
                  value={formData.hire_date}
                  onChange={(value) => handleDateChange("hire_date", value)}
                  disabled={false}
                  maxDate={today}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-sm md:text-lg font-semibold border-b pb-2">Additional Information</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Birth Date</label>
                <Calendar
                  label="Birth Date"
                  value={formData.birth_date}
                  onChange={(value) => handleDateChange("birth_date", value)}
                  disabled={false}
                  maxDate={today}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Marital Status</label>
                <CustomSelect
                  value={formData.marital_status}
                  onChange={(val) => setFormData(prev => ({ ...prev, marital_status: val }))}
                  options={maritalOptions}
                  placeholder="Select Status"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs md:text-sm text-gray-700">Other Information</label>
                <textarea
                  name="other_info"
                  value={formData.other_info}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] h-12 resize-none md:px-3 md:py-2 md:h-16"
                  placeholder="Add any additional information here"
                />
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-xs md:text-sm text-gray-700 mb-1 md:mb-2">Profile Picture</label>
                <div className="flex flex-col items-center space-y-2 md:space-y-4">
                  {previewImage && (
                    <div className="h-16 w-16 md:h-24 md:w-24 rounded-full overflow-hidden border border-gray-300 shadow-md">
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full text-xs md:text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#333333] file:text-white hover:file:bg-[#666666] md:file:mr-4 md:file:py-2 md:file:px-4 md:file:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 md:space-x-4 md:pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 md:px-6 md:py-2 md:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] disabled:opacity-50 md:px-6 md:py-2 md:text-sm"
            >
              {isSubmitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployee