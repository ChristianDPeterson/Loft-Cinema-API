# iCal Generator

iCal Generator is a Javascript utility for generating `.ical` files from public calendars. As of now, only Ticketmaster and The Loft Cinema are supported. To read more about this project, see [this blog post](https://cpeterson.co/posts/loft-cinema-webcal-calendar).

## Installation
```bash
npm install
```

You will need to specify a `TICKETMASTER_API_KEY` in an `.env` file. A Ticketmaster API key can be obtained for free for developers from [Ticketmaster Developer](https://developer.ticketmaster.com/products-and-docs/apis/getting-started/).

## Usage

On build, iCal Generator will generate a folder called `venues` with a `.ical` for each venue. To configure more venues, add them to the `ticketmasterVenues` in `src/index.ts`. You can find the Venue ID from the Ticketmaster API.

```bash
npm build
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
