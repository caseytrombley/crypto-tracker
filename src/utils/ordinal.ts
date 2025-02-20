export const getOrdinalSuffix = (n: number): string => {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  // Handle special cases for 11, 12, 13
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  // Return based on the last digit
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};
