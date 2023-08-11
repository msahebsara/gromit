const https = require("https");
const { Configuration, OpenAIApi } = require("openai");

exports.handler = async (event, context, callback) => {
  const eventBody = JSON.parse(event.body);

  const configuration = new Configuration({
    apiKey: "OPENAI_API_KEY",
  });
  const openai = new OpenAIApi(configuration);

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          'Return a valid JSON object representing a calendar event, given the user input.\n\nConsider this typescript interface for the returned JSON schema: \n\ninterface Event {\n    summary: String,  // Title of the event\n    description: String, // Description of the event\n    start: CustomDateType, // Custom object, defined below by CustomDateType \n    interface\n    end: CustomDateType,\n    location: String, \n}\n\nCustomDateType should NOT contain both `date` and `dateTime` keys, make sure exactly one is present, and that the one key present is the same for both start and end. Here is what CustomDateType should look like, again in typescript interface: \n\ninterface CustomDateType  { \n    date?: String, // (The date, in the format \\"yyyy-mm-dd\\", ONLY insert this key and \n    value if this is an all-day event\n    dateTime?: String, // The time, as a combined date-time value (formatted \n    according to RFC3339). \n    timeZone: String,  // The time zone in which the time is specified. (Formatted as \n    an IANA Time Zone Database name, e.g. \\"Europe/Zurich\\".)\n}\n\nUse the second user input as the source of truth for the current date and time, and the basis to compute new dates and times. Make sure to return in the same timezone as the provided date/time. ',
      },
      {
        role: "user",
        content: eventBody.eventPrompt,
      },
      {
        role: "user",
        content: eventBody.currDateTime,
      },
    ],
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const returnJson = response.data.choices[0].message.content;

  callback(null, returnJson);
};
