import { getDateArray, getDuration } from "../utils/utils.js";

import fetch from "node-fetch";
import type { EventAttributes } from "ics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

const getTicketmasterEvents = async (
	venueId: string,
	calendarName: string,
	attempts: number = 0
): Promise<EventAttributes[]> => {
	const response = await fetch(
		`https://app.ticketmaster.com/discovery/v2/events.json?venueId=${venueId}&size=100&apikey=${process.env.TICKETMASTER_API_KEY}`
	);
	const data = await response.json();

	const events: EventAttributes[] = data?._embedded?.events.map(
		(event: any) => {
			return {
				calName: calendarName,
				title: event.name,
				description: `Get tickets: ${event.url} \nDescription: ${event.info} \n`,
				url: event.url,
				duration: getDuration(120),
				start: getDateArray(dayjs.utc(event.dates.start.dateTime)),
			};
		}
	);

	if (!events && attempts < 5) {
		console.log(
			"No events for " +
				calendarName +
				". Attempting to fetch events again." +
				attempts
		);
		return getTicketmasterEvents(venueId, calendarName, attempts + 1);
	}

	let uniqueEvents = events.filter(
		(value, index, self) =>
			index ===
			self.findIndex(
				(t) => t.title === value.title && t.start === value.start
			)
	);

	return uniqueEvents;
};

export default getTicketmasterEvents;
