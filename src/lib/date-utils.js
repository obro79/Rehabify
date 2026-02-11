"use strict";
/**
 * Centralized date formatting utilities
 *
 * Consolidates date formatting patterns used throughout the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatDateString = formatDateString;
exports.formatRelativeTime = formatRelativeTime;
exports.formatTimestamp = formatTimestamp;
exports.formatRelativeDate = formatRelativeDate;
exports.formatDateKey = formatDateKey;
exports.isSameDay = isSameDay;
exports.isToday = isToday;
exports.getStartOfWeek = getStartOfWeek;
exports.getWeekDates = getWeekDates;
exports.getTimeOfDayGreeting = getTimeOfDayGreeting;
/**
 * Format a Date object to a localized string
 * @param date - The date to format
 * @param format - 'long' for full month name, 'short' for abbreviated
 * @returns Formatted date string (e.g., "January 15, 2024" or "Jan 15, 2024")
 */
function formatDate(date, format) {
    if (format === void 0) { format = "short"; }
    if (!date)
        return "";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: format === "long" ? "long" : "short",
        day: "numeric",
    });
}
/**
 * Format a date string to a localized string
 * @param dateString - ISO date string or parseable date string
 * @param format - 'long' for full month name, 'short' for abbreviated
 * @returns Formatted date string
 */
function formatDateString(dateString, format) {
    if (format === void 0) { format = "short"; }
    return formatDate(new Date(dateString), format);
}
/**
 * Format a date as relative time (e.g., "5m ago", "2h ago")
 * Best for recent timestamps like messages or notifications
 * @param date - The date to format (Date object or ISO string)
 * @returns Relative time string
 */
function formatRelativeTime(date) {
    var dateObj = typeof date === "string" ? new Date(date) : date;
    var now = new Date();
    var diffMs = now.getTime() - dateObj.getTime();
    var diffMins = Math.floor(diffMs / (1000 * 60));
    var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1)
        return "Just now";
    if (diffMins < 60)
        return "".concat(diffMins, "m ago");
    if (diffHours < 24)
        return "".concat(diffHours, "h ago");
    if (diffDays === 1)
        return "Yesterday";
    if (diffDays < 7)
        return "".concat(diffDays, "d ago");
    return formatDate(dateObj, "short");
}
/**
 * Format a date as a timestamp with time of day
 * Best for message threads where exact time matters
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted timestamp (e.g., "3:45 PM", "Yesterday 3:45 PM", "Mon 3:45 PM")
 */
function formatTimestamp(date) {
    var dateObj = typeof date === "string" ? new Date(date) : date;
    var now = new Date();
    var diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return dateObj.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }
    else if (diffDays === 1) {
        return "Yesterday ".concat(dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
    else if (diffDays < 7) {
        return dateObj.toLocaleDateString([], {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
        });
    }
    else {
        return dateObj.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }
}
/**
 * Format a date as relative date (e.g., "Today", "Yesterday", "3 days ago")
 * Best for displaying dates in lists or activity feeds
 * @param date - The date to format
 * @returns Relative date string
 */
function formatRelativeDate(date) {
    var now = new Date();
    var diffTime = now.getTime() - date.getTime();
    var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return "Today";
    if (diffDays === 1)
        return "Yesterday";
    if (diffDays < 7)
        return "".concat(diffDays, " days ago");
    if (diffDays < 14)
        return "1 week ago";
    if (diffDays < 30)
        return "".concat(Math.floor(diffDays / 7), " weeks ago");
    return formatDate(date, "short");
}
/**
 * Format a date as an ISO date key (YYYY-MM-DD)
 * Useful for object keys or comparisons
 * @param date - The date to format
 * @returns ISO date string
 */
function formatDateKey(date) {
    return date.toISOString().split("T")[0];
}
/**
 * Check if two dates are the same calendar day
 * @param a - First date
 * @param b - Second date
 * @returns True if same day
 */
function isSameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
function isToday(date) {
    return isSameDay(date, new Date());
}
/**
 * Get the start of a week (Sunday) for a given date
 * @param date - The date
 * @returns Date representing the start of the week
 */
function getStartOfWeek(date) {
    var result = new Date(date);
    var day = result.getDay();
    result.setDate(result.getDate() - day);
    result.setHours(0, 0, 0, 0);
    return result;
}
/**
 * Get an array of dates for a week starting from a given date
 * @param startDate - The start date of the week
 * @returns Array of 7 dates
 */
function getWeekDates(startDate) {
    return Array.from({ length: 7 }, function (_, i) {
        var date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date;
    });
}
/**
 * Get a time-of-day greeting based on current hour
 * @returns "Good morning", "Good afternoon", or "Good evening"
 */
function getTimeOfDayGreeting() {
    var hour = new Date().getHours();
    if (hour < 12)
        return "Good morning";
    if (hour < 17)
        return "Good afternoon";
    return "Good evening";
}
