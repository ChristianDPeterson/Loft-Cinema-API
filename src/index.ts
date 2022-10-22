import "dotenv/config";
import { writeFileSync, mkdir } from "fs";

import chromium from "chrome-aws-lambda";
import ics from "ics";

import getLoftCinemaEvents from "./calendars/LoftCinema.js";
import getTicketmasterEvents from "./calendars/ticketmaster.js";

const ticketmasterVenues = [
	{
		venueId: "KovZpZAt6ndA",
		name: "191 Toole",
		path: "toole",
	},
	{
		venueId: "KovZpZAdlFaA",
		name: "Rialto Theatre",
		path: "rialtotheatre",
	},
	{
		venueId: "KovZ917A887",
		name: "Van Buren",
		path: "vanburen",
	},
	{
		venueId: "KovZpZA1kt1A",
		name: "Crescent Ballroom",
		path: "crescentballroom",
	},
	{
		venueId: "KovZpZAt6tEA",
		name: "Valley Bar",
		path: "valleybar",
	},
	{
		venueId: "KovZpZAdlFFA",
		name: "Nile Theater",
		path: "niletheater",
	},
	{
		venueId: "KovZ917AJpk",
		name: "Rebel Lounge",
		path: "rebellounge",
	},
];

async function main() {
	// get Loft Cinema Events
	const browser = await chromium.puppeteer.launch();
	const events = await getLoftCinemaEvents(browser);
	await browser.close();

	ics.createEvents(events, (error, value) => {
		if (error) {
			console.log(error);
		}
		writeFileSync("event.ics", value);
	});

	// get Ticketmaster Events
	await ticketmasterVenues.forEach(async (venue) => {
		const events = await getTicketmasterEvents(venue.venueId, venue.name); // 191 Toole

		mkdir(venue.path, (err) => {});

		ics.createEvents(events, (error, value) => {
			if (error) {
				console.log(error);
			}
			writeFileSync(`${venue.path}/event.ics`, value);
		});
	});
}

await main();
