import { getDateArray, getDuration, } from "../utils/utils.js";
import fetch from "node-fetch";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
const getTicketmasterEvents = async (venueId, calendarName) => {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?venueId=${venueId}&apikey=${process.env.TICKETMASTER_API_KEY}`);
    const data = await response.json();
    // const response = await fetch(
    // 	`https://app.ticketmaster.com/discovery/v2/venues.json?stateCode=AZ&keyword=rebel&apikey=${process.env.TICKETMASTER_API_KEY}`
    // );
    // const data = await response.json();
    const events = data?._embedded?.events.map((event) => {
        return {
            calName: calendarName,
            title: event.name,
            description: `Get tickets: ${event.url} \nDescription: ${event.info} \n`,
            url: event.url,
            duration: getDuration(120),
            start: getDateArray(dayjs.utc(event.dates.start.dateTime).utcOffset(-7)),
        };
    });
    // console.log(JSON.stringify(data, null, 4));
    return events;
};
export default getTicketmasterEvents;
