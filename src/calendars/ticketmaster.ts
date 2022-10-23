import { getDateArray, getDuration } from "../utils/utils.js";

import fetch from "node-fetch";
import type { EventAttributes } from "ics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

const getTicketmasterEvents = async (
	venueId: string,
	calendarName: string
): Promise<EventAttributes[]> => {
	const response = await fetch(
		`https://app.ticketmaster.com/discovery/v2/events.json?venueId=${venueId}&apikey=${process.env.TICKETMASTER_API_KEY}`
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

	return events;
};

export default getTicketmasterEvents;
