export const getFullName = (firstName: string, lastName: string | null) => {
  return `${firstName} ${lastName || ""}`.trim();
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
