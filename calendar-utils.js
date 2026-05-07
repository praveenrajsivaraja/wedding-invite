/**
 * Browser + Node (tests): build Google Calendar URLs and .ics payloads for wedding events.
 * Assumes all-day events; end date is exclusive (next calendar day).
 */
(function attachWeddingCalendarUtils(global) {
    'use strict';

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function formatGoogleCalendarAllDayRange(startDate, endDateExclusive) {
        const s =
            startDate.getFullYear() +
            pad2(startDate.getMonth() + 1) +
            pad2(startDate.getDate());
        const e =
            endDateExclusive.getFullYear() +
            pad2(endDateExclusive.getMonth() + 1) +
            pad2(endDateExclusive.getDate());
        return `${s}/${e}`;
    }

    /**
     * @param {{ title: string, startDate: Date, endDateExclusive: Date, details?: string, location?: string }} opts
     */
    function buildGoogleCalendarUrl(opts) {
        const dates = formatGoogleCalendarAllDayRange(opts.startDate, opts.endDateExclusive);
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: opts.title,
            dates,
            details: opts.details || '',
            location: opts.location || ''
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    function escapeIcs(text) {
        return String(text || '')
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    function formatIcsDateValue(d) {
        return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
    }

    /**
     * @param {{ events: Array<{ title: string, startDate: Date, endDateExclusive: Date, description?: string, location?: string }> }} opts
     */
    function buildIcsCalendar(opts) {
        const now = new Date();
        const stamp = `${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Wedding Invite//EN',
            'CALSCALE:GREGORIAN'
        ];

        opts.events.forEach((ev, index) => {
            const uid = `wedding-invite-${stamp}-${index}@local`;
            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${stamp}`);
            lines.push(`DTSTART;VALUE=DATE:${formatIcsDateValue(ev.startDate)}`);
            lines.push(`DTEND;VALUE=DATE:${formatIcsDateValue(ev.endDateExclusive)}`);
            lines.push(`SUMMARY:${escapeIcs(ev.title)}`);
            if (ev.location) {
                lines.push(`LOCATION:${escapeIcs(ev.location)}`);
            }
            if (ev.description) {
                lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
            }
            lines.push('END:VEVENT');
        });

        lines.push('END:VCALENDAR');
        return lines.join('\r\n');
    }

    global.WeddingCalendarUtils = {
        buildGoogleCalendarUrl,
        buildIcsCalendar
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
