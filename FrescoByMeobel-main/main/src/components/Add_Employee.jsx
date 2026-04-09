"use client"

import { useState, useEffect, useRef } from "react"
import Calendar from "./Calendar"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 bg-white dark:bg-dark-bg transition-colors border-gray-200 dark:border-dark-border ${
          !value ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform text-gray-400 dark:text-gray-500 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl ${
                value === option.value
                  ? "bg-gray-900 dark:bg-gray-600 text-white font-medium"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-bg"
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

const PillToggleGroup = ({ value, onChange, options }) => (
  <div className="flex gap-2 flex-wrap">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
          value === opt.value
            ? "bg-gray-900 dark:bg-gray-600 text-white border-gray-900 dark:border-gray-600"
            : "bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-500"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

const INITIAL_FORM = {
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

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 placeholder-gray-300 dark:placeholder-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100"

function AddEmployee({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setExpanded(false)
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      setExpanded(false)
    }
  }, [isOpen])

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop > 10) setExpanded(true)
  }

  const resetForm = () => { setFormData(INITIAL_FORM); setError(""); setPreviewImage(null) }

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => { resetForm(); onClose() }, 300)
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
      try { data = JSON.parse(responseText) } catch { throw new Error(`Server response: ${responseText}`) }

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
      handleClose()
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

  const handleDateChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }))

  const today = dayjs().format("YYYY-MM-DD")

  const roleOptions = [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "employee", label: "Employee" },
  ]
  const maritalOptions = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "widowed", label: "Widowed" },
  ]
  const activeOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ]

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`, transition: "background-color 0.3s ease" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="w-full bg-white dark:bg-dark-card rounded-t-3xl flex flex-col border-t border-transparent dark:border-dark-border"
        style={{
          maxHeight: expanded ? "92vh" : "50vh",
          maxWidth: "600px",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex justify-center mb-3">
            <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add employee</h2>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Full name */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Full name</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" required className={inputClass} />
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" required className={inputClass} />
              </div>
            </div>

            {/* Email + Employee # */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Optional" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Employee #</label>
                <input type="number" name="employee_number" value={formData.employee_number} onChange={handleChange} placeholder="Optional" required className={inputClass} />
              </div>
            </div>

            {/* Position + Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Position</label>
                <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Optional" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Required" required className={inputClass} />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Optional" required className={inputClass} />
            </div>

            {/* Hire + Birth Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Hire date</label>
                <Calendar label="Hire date" value={formData.hire_date} onChange={(value) => handleDateChange("hire_date", value)} disabled={false} maxDate={today} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Birth date</label>
                <Calendar label="Birth date" value={formData.birth_date} onChange={(value) => handleDateChange("birth_date", value)} disabled={false} maxDate={today} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
              <textarea
                name="other_info"
                value={formData.other_info}
                onChange={handleChange}
                placeholder="Optional details, allergies, etc."
                className={`${inputClass} resize-none h-20`}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Role</label>
              <CustomSelect value={formData.role} onChange={(val) => setFormData((prev) => ({ ...prev, role: val }))} options={roleOptions} placeholder="Select role" />
            </div>

            {/* Marital status */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Marital status</label>
              <PillToggleGroup value={formData.marital_status} onChange={(val) => setFormData((prev) => ({ ...prev, marital_status: val }))} options={maritalOptions} />
            </div>

            {/* Active status */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Status</label>
              <PillToggleGroup value={String(formData.active)} onChange={(val) => setFormData((prev) => ({ ...prev, active: val === "true" }))} options={activeOptions} />
            </div>

            {/* Profile picture */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Profile picture</label>
              <div className="flex items-center gap-4">
                {previewImage ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-dark-border flex-shrink-0">
                    <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  onChange={handleChange}
                  className="flex-1 text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-gray-900 dark:file:bg-gray-600 file:text-white hover:file:bg-gray-700 dark:hover:file:bg-gray-500 transition-all"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-employee-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full text-sm font-medium bg-[#b5cfaa] text-[#3a5a2e] hover:bg-[#9bbf8c] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : "Save employee"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddEmployee