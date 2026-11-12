const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const RELATIVE_TIME_UNITS = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
];

function getStartOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function formatCommentDate(createdAt) {
  if (!createdAt) {
    return "Date unavailable";
  }

  const timestamp = new Date(createdAt).getTime();

  if (Number.isNaN(timestamp)) {
    return "Date unavailable";
  }

  const now = new Date();
  const differenceInSeconds = (timestamp - now.getTime()) / 1000;
  const absoluteDifferenceInSeconds = Math.abs(differenceInSeconds);

  if (absoluteDifferenceInSeconds < 60) {
    return "just now";
  }

  if (absoluteDifferenceInSeconds < 3600) {
    return RELATIVE_TIME_FORMATTER.format(
      Math.round(differenceInSeconds / 60),
      "minute",
    );
  }

  const calendarDayDifference = Math.round(
    (getStartOfDay(new Date(timestamp)) - getStartOfDay(now)) / 86_400_000,
  );

  if (calendarDayDifference === 0) {
    return "today";
  }

  if (calendarDayDifference === -1) {
    return "yesterday";
  }

  if (calendarDayDifference === 1) {
    return "tomorrow";
  }

  const relativeUnit = RELATIVE_TIME_UNITS.find(
    ({ seconds }) => absoluteDifferenceInSeconds >= seconds,
  );

  return RELATIVE_TIME_FORMATTER.format(
    Math.round(differenceInSeconds / relativeUnit.seconds),
    relativeUnit.unit,
  );
}
